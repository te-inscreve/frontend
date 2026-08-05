# `@te-inscreve/rest`

HTTP client for the "te inscreve" Django REST API. Nothing throws on failure:
every request resolves with a `Result` the compiler makes you narrow before you
can read the data.

```ts
import { HttpClient } from "@te-inscreve/rest";

const rest = new HttpClient({
    baseUrl: env.API_URL,
    getCsrfToken: async () => (await cookies()).get("csrftoken")?.value ?? null,
});

const result = await rest.get<Evento[]>("/eventos", {
    next: { revalidate: 10, tags: ["eventos"] },
});

if (!result.ok) return handle(result.error);
return result.data; // Evento[]
```

`withToken(jwt)` returns a copy bound to a bearer token — that is how the tRPC
context hands the signed-in user's JWT to procedures.

## Handling failures

`result.error` is one of three kinds: `NetworkError` (the request never landed),
`HttpError` and its status subclasses (the API answered non-2xx), or
`ParseError` (a 2xx body that wouldn't parse). Use the guards for one-off checks:

```ts
if (isHttpError(result.error) && result.error.status === 404) return null;
```

`matchHttpError` covers every branch at once. All handlers are required, so
forgetting one is a compile error rather than a production bug:

```ts
const message = matchHttpError(result.error, {
    unauthorized: () => redirect("/login"),
    badRequest: (e) => setFormErrors(e.fieldErrors),
    unprocessable: (e) => setFormErrors(e.fieldErrors),
    tooManyRequests: (e) => `Tente de novo em ${e.retryAfter ?? 60}s.`,
    forbidden: () => "Você não tem permissão para isso.",
    notFound: () => "Não encontrado.",
    notAcceptable: () => "Formato não suportado.",
    conflict: () => "Esse registro já existe.",
    server: () => "O servidor falhou. Tente novamente.",
    network: () => "Sem conexão com o servidor.",
    otherwise: () => "Algo deu errado.",
});
```

The guards and `matchHttpError` dispatch on a brand and on `kind`/`status`, not
on `instanceof` — bundlers duplicate this package across chunks, and prototype
checks fail across that boundary.

`HttpError.fieldErrors` groups a DRF error body by field name, ready to bind to
a form. Non-field errors land under the `""` key. Both DRF shapes are handled:
the `drf-standardized-errors` envelope and the raw field-keyed dict.

## Request bodies

Strings and the binary/streaming body types — `FormData`, `Blob`, `File`,
`ArrayBuffer(View)`, `URLSearchParams`, `ReadableStream` — are handed to `fetch`
untouched, so it derives their `Content-Type` itself. That is what lets a
`FormData` upload keep the multipart boundary `fetch` generates for it.

Everything else is JSON-encoded with `Content-Type: application/json`. The
default falls this way on purpose: an object `fetch` wouldn't know how to send
becomes JSON rather than a silent `[object Object]`.

The body is always the second argument — `post`, `put`, `patch`, `delete` and
`options` all take `(url, body?, init?)`, and `get` takes `(url, init?)`.
`init` is the transport options only: `CustomFetchProps` omits `body`, so there
is exactly one way to send one, and no way at all on a `GET`.

Those types are recognized by `Symbol.toStringTag`, not `instanceof` — so a
subclass of `Blob` is still treated as a blob, and a value that crossed a realm
or a duplicated bundler chunk is too.

## Timeouts

`timeout` (per call, or `timeout` on the client config as the default) aborts
the request and resolves with a `NetworkError`. It covers the response body
stream too, not just the headers. A `signal` you pass is composed with it —
whichever fires first wins.

## Layout

| File                    | Holds                                                 |
| ----------------------- | ----------------------------------------------------- |
| `src/http-client.ts`    | the class: verbs, `buildUrl`, `buildInit`, `request`  |
| `src/errors.ts`         | the 13 error classes + `httpErrorFor`                 |
| `src/error-handling.ts` | guards + `matchHttpError`                             |
| `src/internal/`         | headers, body encoding, timeouts, response → `Result` |
| `src/types/`            | `Client`, `Result`, and the DRF body shapes           |

`src/internal/` is not exported from the barrel — it is the runtime plumbing,
deliberately kept out of the reading path.
