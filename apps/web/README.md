# Building features in `apps/web`

How to use the auth and tRPC layers this app already wires up. The root
[`README.md`](../../README.md) explains _why_ the architecture looks like this;
this file explains _what to type_.

## The pieces you import

| Import                                                     | Runs on      | Use it for                                      |
| ---------------------------------------------------------- | ------------ | ----------------------------------------------- |
| `~/shared/trpc/server` → `trpc`                            | Server (RSC) | `prefetch()` queries before rendering           |
| `~/shared/trpc/server` → `HydrateClient`                   | Server (RSC) | Hand prefetched data to client components       |
| `~/shared/trpc/react` → `useTRPC`                          | Client       | `useQuery` / `useSuspenseQuery` / `useMutation` |
| `~/shared/auth/server` → `getSession`                      | Server (RSC) | Read the session, gate a page                   |
| `~/shared/auth/client` → `signIn`, `useSession`, `signOut` | Client       | Login forms, session in the UI                  |
| `@te-inscreve/schemas`                                     | Both         | Zod schemas + inferred types                    |
| `@te-inscreve/components`                                  | Both         | `Button`, `Input`, `Label`, `cn`                |

Never import `@te-inscreve/rest` from a page or component. The REST client is
server-only and reaches the browser exclusively through tRPC.

Feature code lives in `src/features/<domain>/` (`eventos`, `inscricoes`,
`avaliacoes`, `entidades`, `usuarios`). `src/app/` holds routes that compose
those features.

## Adding a feature end to end

Four files, in this order. `evento` is the reference implementation — copy it.

### 1. Schema — `packages/schemas/src/index.ts`

The single source of truth for anything crossing the REST boundary.

```ts
export const inscricaoSchema = z.object({
    id: z.number().int(),
    eventoId: z.number().int(),
    status: z.enum(["pendente", "confirmada", "cancelada"]),
});
export type Inscricao = z.infer<typeof inscricaoSchema>;

export const createInscricaoSchema = inscricaoSchema.pick({ eventoId: true });
export type CreateInscricaoInput = z.infer<typeof createInscricaoSchema>;
```

### 2. Router — `packages/api/src/router/inscricao.ts`

`ctx.rest` already carries the signed-in user's JWT. Calls never throw: narrow
on `.ok`, then re-throw `result.error` and the middleware in `trpc.ts` turns the
status into the matching tRPC code.

```ts
import type { TRPCRouterRecord } from "@trpc/server";

import type { Inscricao } from "@te-inscreve/schemas";
import { createInscricaoSchema } from "@te-inscreve/schemas";

import { protectedProcedure } from "../trpc";

export const inscricaoRouter = {
    minhas: protectedProcedure.query(async ({ ctx }) => {
        const result = await ctx.rest.get<Inscricao[]>("/inscricoes", {
            next: { revalidate: 30, tags: ["inscricoes"] },
        });
        if (!result.ok) throw result.error;
        return result.data;
    }),

    criar: protectedProcedure
        .input(createInscricaoSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.rest.post<Inscricao>("/inscricoes", input);
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
```

Pick the procedure per endpoint:

- `publicProcedure` — anyone can call it. `ctx.session` may be `null`.
- `protectedProcedure` — rejects with `UNAUTHORIZED` when there is no session.
  Guarantees `ctx.session.user` and `ctx.token` are non-null.

Handle a status inline only when it is a _meaningful outcome_ rather than a
failure, the way `evento.byId` turns 404 into `null`:

```ts
if (!result.ok) {
    if (result.status === 404) return null;
    throw result.error;
}
```

### 3. Register it — `packages/api/src/root.ts`

```ts
export const appRouter = createTRPCRouter({
    auth: authRouter,
    evento: eventoRouter,
    inscricao: inscricaoRouter,
});
```

Types flow to the web and mobile clients from here. No codegen step.

### 4. Consume it — `apps/web/src/features/inscricoes/`

See the next two sections.

## Reading data

### Server component + client component (the default)

Prefetch on the server, render on the client. No loading waterfall, no
`useEffect`.

```tsx
// src/app/eventos/page.tsx
import { Suspense } from "react";

import { EventoList } from "~/features/eventos/evento-list";
import { HydrateClient, prefetch, trpc } from "~/shared/trpc/server";

export default function EventosPage() {
    prefetch(trpc.evento.all.queryOptions());

    return (
        <HydrateClient>
            <Suspense fallback={<p>Carregando…</p>}>
                <EventoList />
            </Suspense>
        </HydrateClient>
    );
}
```

```tsx
// src/features/eventos/evento-list.tsx
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/shared/trpc/react";

export function EventoList() {
    const trpc = useTRPC();
    const { data: eventos } = useSuspenseQuery(trpc.evento.all.queryOptions());

    return (
        <ul>
            {eventos.map((evento) => (
                <li key={evento.id}>{evento.nome}</li>
            ))}
        </ul>
    );
}
```

`prefetch` does not `await` — it kicks the request off and lets `HydrateClient`
stream the result down. Prefetch every query the subtree will ask for.

With input: `prefetch(trpc.evento.byId.queryOptions({ id }))`, and the client
must pass the **same** input for the cache to hit.

### Reading data directly in a server component

`server.tsx` exports the options proxy but keeps its query client private. To
render data straight in an RSC, export it first:

```ts
// src/shared/trpc/server.tsx
export const getQueryClient = cache(createQueryClient); // add `export`
```

```tsx
const eventos = await getQueryClient().fetchQuery(
    trpc.evento.all.queryOptions(),
);
```

Prefer prefetch + hydrate when the data feeds an interactive component — it
keeps one cache entry that mutations can invalidate.

### Client-only query

```tsx
const trpc = useTRPC();
const { data, isPending, error } = useQuery(
    trpc.evento.byId.queryOptions({ id }),
);
```

## Writing data

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/shared/trpc/react";

export function CriarEventoForm() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const criar = useMutation(
        trpc.evento.create.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries({
                    queryKey: trpc.evento.all.queryKey(),
                });
            },
        }),
    );

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                criar.mutate({
                    nome: String(form.get("nome")),
                    dataInicio: String(form.get("dataInicio")),
                    dataFim: String(form.get("dataFim")),
                });
            }}
        >
            <Input name="nome" />
            {criar.error?.data?.fieldErrors?.nome?.map((message) => (
                <p key={message} className="text-destructive text-sm">
                    {message}
                </p>
            ))}
            <Button disabled={criar.isPending}>Criar</Button>
        </form>
    );
}
```

### Busting the Next.js fetch cache

`invalidateQueries` clears React Query's cache in the browser. Requests tagged
with `next: { tags: [...] }` are cached separately by Next, on the server. Clear
those with `revalidateTag` from a server action or route handler in this app —
`packages/api` stays framework-free and cannot import `next/cache`.

```ts
"use server";

import { revalidateTag } from "next/cache";

export async function revalidarEventos() {
    revalidateTag("eventos");
}
```

## Errors

`packages/api` maps Django's status codes and error envelope onto tRPC before
anything reaches the client. A component never inspects a status code.

On any query or mutation error:

| Property                  | Contains                                                       |
| ------------------------- | -------------------------------------------------------------- |
| `error.data?.code`        | `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, …                     |
| `error.data?.fieldErrors` | Django validation errors, keyed by field name — bind to inputs |
| `error.data?.zodError`    | Input that failed the procedure's own Zod schema               |
| `error.message`           | Human-readable message from the API                            |

```tsx
if (error?.data?.code === "UNAUTHORIZED") router.push("/login");
```

5xx responses and unreachable-API failures are collapsed into
`INTERNAL_SERVER_ERROR` with a generic message, so backend internals never leak.

## Auth

Identity lives in the Django API. better-auth only carries its JWT inside an
encrypted cookie. There is no user table here.

### Sign in / sign up

```tsx
"use client";

import { useRouter } from "next/navigation";

import { signIn, signUp } from "~/shared/auth/client";

const router = useRouter();

const { error } = await signIn.rest({ email, password });
if (error) {
    setMessage(error.message ?? "Não foi possível entrar.");
    return;
}
router.refresh(); // re-runs server components with the new session
```

`signUp.rest({ name, email, password })` has the same shape. Both hit the
backend routes configured in `src/shared/auth/server.ts` (`/auth/login` and
`/auth/register` by default) and write the session cookie on success.

Validate the form with `signInSchema` / `signUpSchema` from
`@te-inscreve/schemas` before calling.

### Sign out

```tsx
await signOut();
router.refresh();
```

### Reading the session on the server

```tsx
import { redirect } from "next/navigation";

import { getSession } from "~/shared/auth/server";

export default async function Page() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <p>Olá, {session.user.name || session.user.email}</p>;
}
```

`getSession` is wrapped in `React.cache`, so calling it in a layout and in three
pages decrypts the cookie once per request.

### Reading the session on the client

```tsx
"use client";

import { useSession } from "~/shared/auth/client";

const { data: session, isPending } = useSession();
```

### Where to enforce access

Gate in **both** places, for different reasons:

- `protectedProcedure` in the router is the real boundary — it is what stops an
  unauthenticated request from reaching the API.
- `redirect("/login")` in the page is UX — it stops a logged-out user from
  staring at an empty screen.

A `middleware.ts` check is optional and can only test that the cookie exists; it
cannot validate the JWT.

## Gotchas

- **`@te-inscreve/rest` never throws on a failed request.** Narrow on
  `result.ok`; a `try/catch` around a call will not fire. This applies anywhere
  you use the client directly, not just in procedures.
- **Sessions cannot be revoked.** The cookie _is_ the session store. A logout
  everywhere requires the Django API to reject the JWT.
- **Rotating `AUTH_SECRET` logs everyone out.** Same reason.
- **`env` is validated.** Add a variable to `src/shared/env.ts` (or the package
  `env.ts` it belongs to) and to `.env.example`, or it will not exist at runtime.
- **Server-only modules.** `~/shared/rest` and `~/shared/auth/server` import
  `server-only`. Importing either from a `"use client"` file fails the build.
- **Every procedure change is type-checked across apps.** Run
  `yarn typecheck` from the repo root — mobile consumes the same router types.
