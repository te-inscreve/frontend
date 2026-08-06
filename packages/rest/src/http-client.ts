import type { GetCsrfToken } from "./internal/request";
import type { Client, Result } from "./types/client";
import type { CustomFetchProps } from "./types/http";
import { networkFailure } from "./errors";
import {
    abortAfter,
    BASE_HEADERS,
    csrfHeader,
    serializeBody,
    toHeaderRecord,
} from "./internal/request";
import { toResult } from "./internal/response";

export interface HttpClientOptions {
    /** e.g. `https://api.teinscreve.com` — a trailing slash is fine. */
    baseUrl: string;
    /**
     * Bearer token sent on every request. In the tRPC context this is the JWT the
     * backend issued at login, read back out of the better-auth session cookie.
     */
    token?: string | null;
    /**
     * Supplies the CSRF token for unsafe methods.
     *
     * A hook rather than a `next/headers` import on purpose: importing `cookies()`
     * inside the client would weld it to the Next.js server runtime, making it
     * unusable from React Native, client components, and tests. Wire it up at the
     * composition root instead:
     *
     * ```ts
     * getCsrfToken: async () => (await cookies()).get("csrftoken")?.value ?? null
     * ```
     */
    getCsrfToken?: GetCsrfToken;
    /** Sent on every request. Merged with (and overridden by) per-call headers. */
    defaultHeaders?: Record<string, string>;
    /** Applied when a call doesn't set its own `timeout`, in milliseconds. */
    timeout?: number;
    /** Swap in a custom fetch (tests, tracing, retries). */
    fetch?: typeof globalThis.fetch;
}

/**
 * HTTP client for the "te inscreve" Django REST API.
 *
 * Nothing throws on failure: every request resolves with a {@link Result} the
 * compiler makes you narrow on `.ok` before reading `.data` — {@link NetworkError}
 * when the request never lands, and an `HttpError` subclass for every non-2xx.
 *
 * Anything *not* thrown by this package (a bug in a custom `fetch`, say) still
 * propagates — a `Result` describes a request outcome, not a defect.
 */
export class HttpClient implements Client {
    private readonly baseUrl: string;
    /** Named `config` because `options` is a request method on {@link Client}. */
    private readonly config: HttpClientOptions;
    private readonly headers: Record<string, string>;
    private readonly fetchImpl: typeof globalThis.fetch;

    constructor(config: HttpClientOptions) {
        if (!config.baseUrl) {
            throw new Error("Base URL is required");
        }

        this.config = config;
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.headers = toHeaderRecord(config.defaultHeaders);
        // Looked up per call rather than captured, so Next.js's patched `fetch`
        // (the one that honours `next: { revalidate, tags }`) is the one used.
        this.fetchImpl =
            config.fetch ?? ((...args) => globalThis.fetch(...args));
    }

    public get<T>(url: string, init?: CustomFetchProps) {
        return this.request<T>("GET", url, undefined, init);
    }

    public post<T>(url: string, body?: unknown, init?: CustomFetchProps) {
        return this.request<T>("POST", url, body, init);
    }

    public put<T>(url: string, body?: unknown, init?: CustomFetchProps) {
        return this.request<T>("PUT", url, body, init);
    }

    public patch<T>(url: string, body?: unknown, init?: CustomFetchProps) {
        return this.request<T>("PATCH", url, body, init);
    }

    /**
     * A successful DELETE always carries a status, so it can never be mistaken
     * for a failed one — those come back as `ok: false`.
     */
    public async delete(
        url: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<null>> {
        const result = await this.request<unknown>("DELETE", url, body, init);
        return result.ok
            ? { ok: true, status: result.status, data: null }
            : result;
    }

    public options<T>(url: string, body?: unknown, init?: CustomFetchProps) {
        return this.request<T>("OPTIONS", url, body, init);
    }

    /** Returns a copy of this client bound to a different bearer token. */
    public withToken(token: string | null): HttpClient {
        return new HttpClient({ ...this.config, token });
    }

    /** Builds a full URL from a path.*/
    private buildUrl(path: string) {
        const [_path, _search] = path.split("?", 2);
        return `${this.baseUrl}${_path?.endsWith("/") ? _path : `${_path}/`}${_search ? `?${_search}` : ""}`;
    }

    public getBaseUrl() {
        return this.baseUrl;
    }

    /**
     * Merge the client config with per-call overrides and adding the CSRF token if needed.
     *
     * totally compatible with Next.js extra fetch options, including `next: { revalidate, tags }` and `cache`.
     */
    private async buildInit(
        method: string,
        body: unknown,
        init: CustomFetchProps | undefined,
        signal: AbortSignal | undefined,
    ): Promise<RequestInit> {
        const {
            timeout: _timeout,
            signal: _signal,
            headers,
            ...rest
        } = init ?? {};

        const payload = serializeBody(body);

        return {
            ...rest,
            method,
            headers: {
                ...BASE_HEADERS,
                ...this.headers,
                ...(payload.contentType
                    ? { "content-type": payload.contentType }
                    : {}),
                ...(this.config.token
                    ? { authorization: `Bearer ${this.config.token}` }
                    : {}),
                ...(await csrfHeader(method, this.config.getCsrfToken)),
                ...toHeaderRecord(headers),
            },
            ...(payload.body !== undefined ? { body: payload.body } : {}),
            ...(signal ? { signal } : {}),
        } as RequestInit;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<Result<T>> {
        const url = this.buildUrl(path);
        const ms = init?.timeout ?? this.config.timeout;
        const timeout = ms && ms > 0 ? abortAfter(ms, init?.signal) : null;

        try {
            const requestInit = await this.buildInit(
                method,
                body,
                init,
                timeout?.signal ?? init?.signal ?? undefined,
            );

            let response: Response;
            try {
                response = await this.fetchImpl(url, requestInit);
            } catch (cause) {
                return networkFailure(
                    cause,
                    method,
                    url,
                    timeout?.expired() ?? false,
                );
            }

            return await toResult<T>(response, url, method);
        } finally {
            timeout?.done();
        }
    }
}
