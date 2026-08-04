# Simplify `@te-inscreve/rest`

## Context

`packages/rest` is 1122 lines across 5 files, and reading it is exhausting. Two causes:

1. **`src/http-client.ts` (451 lines) mixes five unrelated jobs** — the public verb methods, body serialization, header normalization, `AbortSignal` feature-detection, and response parsing — behind five layers of indirection (`get` → `toResult` → `request` → `send` → `responseHandler`). Following a single GET means jumping between four methods.
2. **`src/errors.ts` (339 lines) puts the class hierarchy and the handling API in one file**, so the part callers actually use (`isHttpError`, `matchHttpError`) is buried under 13 class declarations.

On top of that, several exports are speculative — written, never called anywhere in the monorepo — and a large share of the line count is TSDoc that restates the signature it sits above.

**Outcome:** same public behavior and same error classes, reorganized into small single-purpose modules, with the runtime plumbing moved out of the reading path. Target ≈700 lines, and `http-client.ts` down to ~130.

**Non-goals:** no new features, no plugin/middleware layer, no changes to the `Result` contract, no renames of anything a consumer imports.

## Decisions taken (locked)

- **All 13 error classes stay.** They are load-bearing: `packages/auth/src/rest-credentials.ts` reads `.fieldErrors` off `BadRequestError`/`UnprocessableEntityError` and `.retryAfter` off `TooManyRequestsError` through `matchHttpError`'s handler types.
- **`Client` interface stays**, and the barrel keeps its wide export surface.
- **Deleted** (zero call sites monorepo-wide): `createRestClient`, `CustomResponse`, `getBlob`, `setHeaders`, `withHeaders`, `getHeaders`.
- **Comments:** keep the *why*, cut the *what*.

## Target structure

```
src/
  index.ts             barrel — same names minus the six deletions
  http-client.ts  ~130 the class: verbs, buildUrl, request
  errors.ts       ~180 the 13 classes + httpErrorFor
  error-handling.ts ~90 guards + matchHttpError + HttpErrorHandlers
  internal/
    request.ts     ~70 headers, body, timeout signal   (not exported from barrel)
    response.ts    ~70 readBody, readRetryAfter, response → Result
  types/
    client.ts      ~55 Client, Result
    http.ts       ~140 DRF shapes + fieldErrors helpers
```

---

## 1. `src/errors.ts` → split in two

**`src/errors.ts`** keeps: `RestError`, `NetworkError`, `HttpError` (+ `HttpErrorOpts`), the 9 status subclasses, `ParseError`, `httpErrorFor`, `AnyRestError`. Bodies unchanged — only the one-line `/** 404 — resource does not exist. */`-style comments go. Keep the `__restError` brand comment verbatim (bundler chunk duplication is genuinely non-obvious).

**`src/error-handling.ts`** (new) moves out, unchanged in behavior: `isRestError`, `isHttpError`, `isNetworkError`, `isParseError`, `HttpErrorHandlers`, `matchHttpError`. Imports the classes as types only where possible. Keep the "casts, not `instanceof`" comment inside `matchHttpError` — it explains the one thing that looks wrong.

Trim `matchHttpError`'s doc block to two lines and move the worked example to a new `packages/rest/README.md`.

## 2. `src/internal/request.ts` (new)

Pure functions, no class, nothing exported from the barrel.

- `BASE_HEADERS`, `UNSAFE_METHODS`, `toHeaderRecord` — moved verbatim.
- `csrfHeader(method, getCsrfToken)` — the current private method, as a free function.
- **`serializeBody`, rewritten** (replaces `isRawBody`'s 10-line `typeof FormData !== "undefined"` allowlist):

  ```ts
  const isJsonBody = (v: unknown) => {
      if (Array.isArray(v)) return true;
      if (typeof v === "number" || typeof v === "boolean") return true;
      if (typeof v !== "object" || v === null) return false;
      const proto: unknown = Object.getPrototypeOf(v);
      return proto === Object.prototype || proto === null;
  };
  ```
  Plain objects, arrays, numbers and booleans are JSON-encoded; everything else (`string`, `FormData`, `Blob`, `ArrayBuffer(View)`, `URLSearchParams`, `ReadableStream`) is handed to `fetch` as-is. Same result as today for every shape that occurs in practice.

- **`abortAfter`, replacing `composeSignal` + `abortStatics`** — drops the `AbortSignal.timeout`/`AbortSignal.any` feature-detection entirely:

  ```ts
  export function abortAfter(ms: number, outer?: AbortSignal | null) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      outer?.addEventListener("abort", () => ctrl.abort(), { once: true });
      return { signal: ctrl.signal, done: () => clearTimeout(timer) };
  }
  ```
  Works identically on Node, browsers, and every Hermes build — no probing needed. Callers with a `signal` but no `timeout` keep passing their signal straight through.

## 3. `src/internal/response.ts` (new)

- `readBody(response, method)` and `readRetryAfter(response)` — moved verbatim (both are already tight; keep the DRF-answers-without-a-content-type comment).
- **`toResult<T>(response, url, method): Promise<Result<T>>`** — absorbs today's `responseHandler`, but **returns** `Result` instead of throwing:
  - 2xx → parse via `readBody`; parse failure → `{ ok: false, error: new ParseError(...) }`.
  - non-2xx → `{ ok: false, error: httpErrorFor({ ..., data: await readBody().catch(() => null), retryAfter: readRetryAfter(response) }) }`.

  This is what removes a whole layer: with no internal throwing, the class's private `toResult` wrapper and its `isRestError` re-throw guard both disappear.

## 4. `src/http-client.ts` — rewrite around one `request`

Public surface is unchanged except the four deletions. `protected` → `private` throughout (nothing subclasses this).

```ts
export class HttpClient implements Client {
    private readonly baseUrl: string;
    private readonly config: HttpClientOptions;
    private readonly headers: Record<string, string>;   // now immutable
    private readonly fetchImpl: typeof globalThis.fetch;

    get<T>(url, init?)               { return this.request<T>("GET", url, undefined, init); }
    post<T>(url, body?, init?)       { return this.request<T>("POST", url, body, init); }
    put / patch                      // same shape
    options<T>(url, init?)           { return this.request<T>("OPTIONS", url, undefined, init); }
    async delete(url, init?): Promise<Result<null>> {
        const r = await this.request<unknown>("DELETE", url, undefined, init);
        return r.ok ? { ok: true, status: r.status, data: null } : r;
    }
    withToken(token) { return new HttpClient({ ...this.config, token }); }

    private buildUrl(path) { /* unchanged */ }
    private async buildInit(method, body, init): Promise<RequestInit> { /* headers + body */ }
    private async request<T>(method, path, body?, init?): Promise<Result<T>> { … }
}
```

`request` is the only place with control flow:

```ts
const url = this.buildUrl(path);
const ms = init?.timeout ?? this.config.timeout;
const t = ms && ms > 0 ? abortAfter(ms, init?.signal) : null;
try {
    let response: Response;
    try {
        response = await this.fetchImpl(url, await this.buildInit(method, body, init));
    } catch (cause) {
        return networkFailure(cause, method, url);   // NetworkError, wrapped as Result
    }
    return await toResult<T>(response, url, method);
} finally {
    t?.done();
}
```

The nested `try` is deliberate: only the `fetch` call becomes a `NetworkError`; a genuine bug inside `toResult` still propagates. The timer is cleared in `finally` *after* the body is read, so the timeout covers the body stream, matching today's `AbortSignal.timeout` behavior.

Keep these comments — each explains something that looks like a mistake:
- `Content-Type` deliberately absent from `BASE_HEADERS` (FormData boundary).
- `fetchImpl` looked up per call so Next's patched `fetch` honours `next: { revalidate, tags }`.
- The `as RequestInit` cast for `next`/`cache`.
- `getCsrfToken` as a hook rather than a `next/headers` import.

## 5. `src/types/` — light touch

- `types/client.ts`: drop `getBlob` from `Client`; compress the per-method TSDoc to one line each; keep the `Result` doc block (it explains the whole design).
- `types/http.ts`: delete `CustomResponse`; keep `isOk`, `isResponseError`, `isValidationError`, `toFieldErrors`, `extractErrorMessage` and the DRF shape docs as-is — this file is already doing one job.

## 6. `src/index.ts` + README

Remove `createRestClient` and `CustomResponse` from the barrel, add the `error-handling` re-exports (same names as before, new source file — consumers see no difference). Add a short `packages/rest/README.md` holding the usage examples pulled out of the TSDoc.

---

## Files touched

| File | Action |
|---|---|
| `src/http-client.ts` | rewrite (~451 → ~130) |
| `src/errors.ts` | trim to classes only (~339 → ~180) |
| `src/error-handling.ts` | new (~90) |
| `src/internal/request.ts` | new (~70) |
| `src/internal/response.ts` | new (~70) |
| `src/types/client.ts` | trim, drop `getBlob` |
| `src/types/http.ts` | drop `CustomResponse`, trim |
| `src/index.ts` | update exports |
| `packages/rest/README.md` | new |

**No consumer file needs to change.** Verified against every call site: `packages/api/src/{trpc,rest-error}.ts`, `packages/api/src/router/evento.ts`, `packages/auth/src/{index,rest-credentials}.ts`, `apps/web/src/shared/rest.ts`. All of them use only `HttpClient`, `withToken`, `get`/`post`, the four guards, and `matchHttpError` — every one of which survives unchanged.

## Verification

There is no test infrastructure anywhere in the monorepo, so verification is compiler + smoke:

1. `yarn workspace @te-inscreve/rest typecheck` and `yarn workspace @te-inscreve/rest lint` — must be clean.
2. `yarn workspace @te-inscreve/rest build` — `tsc` emits `dist/index.d.ts`; confirm the new `error-handling` names appear there (the `exports` map points `types` at `dist/`, so a missing re-export breaks consumers silently).
3. `yarn typecheck` at the repo root — proves `packages/api`, `packages/auth`, and `apps/web` still compile against the new surface, and catches any deleted symbol still referenced.
4. Smoke against the real Django API with `apps/web` running: a `GET` through `evento.all` (exercises `next: { revalidate, tags }` forwarding + `Result` narrowing), a `POST` through `evento.create` (exercises CSRF header + JSON body + `fieldErrors` on a 400), and a login attempt with bad credentials (exercises `matchHttpError`).

## Flagged, not in scope

`packages/auth/src/rest-credentials.ts:198-243` wraps `restClient.post` in `try/catch` and routes the catch through `matchHttpError` — but `post` never throws, it returns `{ ok: false, error }`. So on a rejected login the catch never runs, `data` stays `undefined`, and the user gets `INTERNAL_SERVER_ERROR "unexpected auth payload"` instead of `UNAUTHORIZED "Invalid e-mail or password."` The fix is to narrow on `result.ok` and pass `result.error` to `toApiError`, as `packages/api/src/router/evento.ts` already does. This refactor neither causes nor fixes it — fix it as a separate change.
