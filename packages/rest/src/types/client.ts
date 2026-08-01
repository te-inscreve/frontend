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
    /**
     * Performs a GET request to the API.
     * @param url API URL with search params included (e.g., /users?name=John)
     * @param init Request configuration
     * @template T Type of the request response
     */
    get<T>(url: string, init?: CustomFetchProps): Promise<Result<T>>;

    /**
     * Performs a POST request to the API.
     * @param body JSON-encoded, unless it is already a `FormData`/`Blob`/stream
     */
    post<T>(
        url: string,
        body?: unknown,
        init?: Omit<CustomFetchProps, "body">,
    ): Promise<Result<T>>;

    /**
     * Performs a PUT request to the API.
     */
    put<T>(
        url: string,
        body?: unknown,
        init?: Omit<CustomFetchProps, "body">,
    ): Promise<Result<T>>;

    /**
     * Performs a PATCH request to the API.
     */
    patch<T>(
        url: string,
        body?: unknown,
        init?: Omit<CustomFetchProps, "body">,
    ): Promise<Result<T>>;

    /**
     * Performs a DELETE request to the API.
     *
     * Always resolves with a status on success — never `undefined`.
     */
    delete(url: string, init?: CustomFetchProps): Promise<Result<null>>;

    /**
     * Performs an OPTIONS request to the API.
     */
    options<T>(url: string, init?: CustomFetchProps): Promise<Result<T>>;

    /**
     * Downloads a binary payload. Accepts an absolute URL or a path.
     */
    getBlob(url: string, init?: CustomFetchProps): Promise<Result<Blob>>;
}
