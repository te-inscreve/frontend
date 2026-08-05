import type { AnyRestError } from "../errors";
import type { CustomFetchProps } from "./http";

/**
 * A request outcome that TypeScript **forces** you to inspect.
 *
 * Reading `.data` without first narrowing on `.ok` is a compile error, which is
 * the guarantee plain `throw` cannot give you:
 *
 * ```ts
 * const res = await client.get<Evento>("/eventos/1");
 * res.data;                    // ✗ Property 'data' does not exist on type ...
 * if (!res.ok) return null;    // narrow first
 * res.data;                    // ✓ Evento
 * ```
 */
export type Result<T> =
    | { ok: true; status: number; data: T; error?: undefined }
    | {
          ok: false;
          status: number | null;
          data?: undefined;
          error: AnyRestError;
      };

/**
 * Interface for the API client that manages requests to the REST API.
 *
 * `init` is forwarded verbatim to `fetch`, so Next.js caching works:
 *
 * To enable cache: `{ next: { revalidate: 10, tags: ['getEventos'] } }`
 *
 * To remove cache: `revalidateTag('getEventos')`
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/fetch
 * @see https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */
export interface Client {
    /** `url` carries its own search params, e.g. `/users?name=John`. */
    get<T>(url: string, init?: CustomFetchProps): Promise<Result<T>>;

    /** `body` is JSON-encoded, unless it is already a `FormData`/`Blob`/stream. */
    post<T>(
        url: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<T>>;

    /** Full replacement; `body` is encoded as in {@link Client.post}. */
    put<T>(
        url: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<T>>;

    /** Partial update; `body` is encoded as in {@link Client.post}. */
    patch<T>(
        url: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<T>>;

    /**
     * Always resolves with a status on success — never `undefined`.
     *
     * Takes a `body` because DELETE is allowed to carry one (bulk deletes, a
     * reason payload); most calls omit it.
     */
    delete(
        url: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<null>>;

    /** Reads the endpoint's allowed methods and DRF metadata. */
    options<T>(
        url: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<T>>;
}
