# te inscreve — frontend

Monorepo with a **Next.js** web app and a **React Native (Expo)** mobile app,
following the [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo)
pattern — adapted so that **all data comes from the Django REST API**. There is
no Prisma, no Drizzle and no database connection anywhere in this repo.

```text
.
├── apps
│   ├── mobile     # React Native — `@te-inscreve/expo` (SDK 57, expo-router, NativeWind)
│   └── web        # Next.js 16 — `@te-inscreve/nextjs` (App Router, hosts tRPC + better-auth)
├── packages
│   ├── api        # tRPC v11 router (the BFF layer over the REST API)
│   ├── auth       # better-auth, stateless, backed by the REST API's JWT
│   ├── rest       # typed REST client ← replaces create-t3-turbo's `db` package
│   ├── ui         # shadcn-style components for the web app
│   └── validators # zod schemas shared across the boundary
└── tooling
    ├── eslint
    ├── prettier
    ├── tailwind
    └── typescript
```

## How the pieces fit

```text
Expo app  ─┐
           ├─→  Next.js  ─→  tRPC router  ─→  packages/rest  ─→  Django REST API
Web app   ─┘   (/api/trpc)    (ctx.rest)      (Bearer JWT)
                (/api/auth)
```

The Next.js app is the only backend surface. The mobile app is a pure client: it
calls the same `/api/trpc` and `/api/auth` endpoints over the network. That's why
`@te-inscreve/api` is a **dev** dependency of `apps/mobile` — mobile gets the
router's _types_, never its server code.

### Auth without a database

better-auth normally owns a users/sessions table. Here the Django API owns
identity, so better-auth runs in **stateless mode** (`packages/auth`): no
`database` is configured, and the session lives entirely inside an encrypted
(JWE) cookie.

1. `POST /api/auth/sign-in/rest` — a custom better-auth plugin
   (`packages/auth/src/rest-credentials.ts`) forwards the credentials to the
   Django login endpoint.
2. Django returns a JWT. The plugin stores it in `session.token` and writes the
   encrypted session cookie. The cookie's lifetime comes from the JWT's `exp`, so
   the session can never outlive the token it carries.
3. On every tRPC call, `createTRPCContext` decrypts the cookie, pulls the JWT out
   and hands back a REST client already bound to it — procedures just use
   `ctx.rest` and the `Authorization: Bearer …` header is handled for them.

**Trade-off:** stateless sessions cannot be revoked server-side before they
expire. To force a logout everywhere, the Django API has to reject the JWT itself
(short expiry + a denylist, or token rotation).

### Calling the API from a procedure

`packages/rest` never throws: every call resolves with a `Result`, and the
compiler refuses to let you touch `.data` before narrowing on `.ok`. That turns
a status code into something you can treat as a meaningful outcome instead of an
error. Re-throw `result.error` to hand it to the middleware, which converts it
into the matching tRPC error:

```ts
// packages/api/src/router/evento.ts — the reference router
all: publicProcedure.query(async ({ ctx }) => {
  const result = await ctx.rest.get<Evento[]>("/eventos", {
    // forwarded straight to fetch → Next.js caching works
    next: { revalidate: 30, tags: ["eventos"] },
  });
  if (!result.ok) throw result.error;
  return result.data;
}),

byId: publicProcedure.input(...).query(async ({ ctx, input }) => {
  const result = await ctx.rest.get<Evento>(`/eventos/${input.id}`);
  if (!result.ok) {
    if (result.status === 404) return null; // a 404 is not an error here
    throw result.error;
  }
  return result.data;
}),
```

Django's standardized error envelope (`{type, errors: [{code, detail, attr}]}`)
is parsed for you. Validation errors reach the client as
`error.data.fieldErrors`, keyed by field name and ready to bind to a form:

```jsonc
{
    "code": "BAD_REQUEST",
    "fieldErrors": { "nome": ["Este campo não pode ser em branco."] },
}
```

An unreachable API is a `Result` like any other, carrying a `NetworkError`; the
middleware turns it into a clean tRPC error once you re-throw it.

## Getting started

Requires **Node 22** (see `.nvmrc`) and **Yarn 4** (via Corepack).

```bash
corepack enable && nvm use && yarn install
```

Then create your env file and point it at the backend:

```bash
cp .env.example .env
```

| Variable      | Purpose                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `API_URL`     | Base URL of the Django REST API.                                                                                                           |
| `AUTH_SECRET` | Signs/encrypts the session cookie. **This is the session store** — rotating it logs everyone out. Generate with `openssl rand -base64 32`. |

```bash
yarn dev          # everything
yarn dev:next     # web only
yarn dev:expo     # mobile only
yarn typecheck && yarn lint && yarn build
```

For the mobile app, `apps/mobile/src/utils/base-url.ts` resolves your machine's LAN
IP on port 3000 so a physical device can reach the Next.js server. Point it at
your deployed URL for production.

## Adapting it to your backend

The auth routes and payload shape are configurable rather than hardcoded — set
them where `initAuth` is called, in `apps/web/src/shared/auth/server.ts`:

- **Different auth routes?** `restCredentials: { paths: { signIn, signUp } }`
  (defaults: `/auth/login`, `/auth/register`).
- **Different login payload?** Pass `restCredentials.parseAuthResponse` to map it
  onto `{ token, user }`, or edit `restAuthResponseSchema`.

## Notes / gotchas

- **`nodeLinker: node-modules`** in `.yarnrc.yml` is mandatory — Metro cannot
  resolve Yarn PnP.
- **`lightningcss` is pinned to 1.30.1** (root `resolutions`). `react-native-css`
  ships native bindings built against it; newer versions fail Metro bundling with
  an `expected struct Specifier` serde error.
- **`dotenv-cli` is a dependency of `apps/web`**, not only of the root — unlike
  pnpm, Yarn 4 does not put root binaries on a workspace's PATH.
- **NativeWind 5 is a preview release** (as it is upstream in create-t3-turbo).
  It is what supports Tailwind v4 on native.
- `apps/mobile/src/utils/auth.ts` contains one documented type assertion working
  around a declaration bug in `@better-auth/expo@1.6.25`; drop it once upstream
  widens the signature.
