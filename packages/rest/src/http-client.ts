import type { AnyRestError } from "./errors";
import type { Client, Result } from "./types/client";
import type { ApiResponse, CustomFetchProps } from "./types/http";
import { httpErrorFor, isRestError, NetworkError, ParseError } from "./errors";
import { isOk } from "./types/http";

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
    getCsrfToken?: () =>
        string | null | undefined | Promise<string | null | undefined>;
    /** Sent on every request. Merged with (and overridden by) per-call headers. */
    defaultHeaders?: Record<string, string>;
    /** Applied when a call doesn't set its own `timeout`, in milliseconds. */
    timeout?: number;
    /** Swap in a custom fetch (tests, tracing, retries). */
    fetch?: typeof globalThis.fetch;
}

/**
 * Sent on every request unless overridden. `Content-Type` is deliberately absent
 * — it is derived from the body, so a `FormData` upload keeps the multipart
 * boundary `fetch` generates for it.
 */
const BASE_HEADERS: Record<string, string> = {
    accept: "application/json",
    "accept-language": "pt-br",
};

/** Methods Django expects a CSRF token on. */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Bodies `fetch` can send as-is; anything else is JSON-encoded. */
type RawBody =
    | string
    | FormData
    | Blob
    | ArrayBuffer
    | ArrayBufferView
    | URLSearchParams
    | ReadableStream;

/**
 * `instanceof` against optional globals: `FormData` and `ReadableStream` are not
 * guaranteed to exist on every runtime this package targets.
 */
const isRawBody = (value: unknown): value is RawBody =>
    typeof value === "string" ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof FormData !== "undefined" && value instanceof FormData) ||
    (typeof Blob !== "undefined" && value instanceof Blob) ||
    (typeof URLSearchParams !== "undefined" &&
        value instanceof URLSearchParams) ||
    (typeof ReadableStream !== "undefined" && value instanceof ReadableStream);

const serializeBody = (
    body: unknown,
): { body?: RawBody; contentType?: string } => {
    if (body === undefined || body === null) return {};
    if (isRawBody(body)) return { body };
    return { body: JSON.stringify(body), contentType: "application/json" };
};

/**
 * `AbortSignal.timeout`/`any` behind feature detection: React Native's type
 * definitions don't declare them, and older Hermes builds don't ship them.
 */
const abortStatics = AbortSignal as unknown as {
    timeout?: (ms: number) => AbortSignal;
    any?: (signals: AbortSignal[]) => AbortSignal;
};

/** Normalizes any `fetch` header input to a lower-cased record. */
const toHeaderRecord = (
    headers: CustomFetchProps["headers"],
): Record<string, string> => {
    if (!headers) return {};
    const record: Record<string, string> = {};
    new Headers(headers).forEach((value, key) => {
        record[key] = value;
    });
    return record;
};

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
    protected readonly baseUrl: string;
    /** Named `config` because `options` is a request method on {@link Client}. */
    protected readonly config: HttpClientOptions;
    protected readonly fetchImpl: typeof globalThis.fetch;
    private headers: Record<string, string>;

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

    public async get<T>(url: string, init?: CustomFetchProps) {
        return this.toResult<T>(() =>
            this.request<T>("GET", url, undefined, init),
        );
    }

    public async post<T>(
        url: string,
        body?: unknown,
        init?: Omit<CustomFetchProps, "body">,
    ) {
        return this.toResult<T>(() => this.request<T>("POST", url, body, init));
    }

    public async put<T>(
        url: string,
        body?: unknown,
        init?: Omit<CustomFetchProps, "body">,
    ) {
        return this.toResult<T>(() => this.request<T>("PUT", url, body, init));
    }

    public async patch<T>(
        url: string,
        body?: unknown,
        init?: Omit<CustomFetchProps, "body">,
    ) {
        return this.toResult<T>(() =>
            this.request<T>("PATCH", url, body, init),
        );
    }

    /**
     * A successful DELETE always carries a status, so it can never be mistaken
     * for a failed one — those come back as `ok: false`.
     */
    public async delete(
        url: string,
        init?: CustomFetchProps,
    ): Promise<Result<null>> {
        return this.toResult<null>(async () => {
            const { status } = await this.request<unknown>(
                "DELETE",
                url,
                undefined,
                init,
            );
            return { status, data: null };
        });
    }

    public async options<T>(url: string, init?: CustomFetchProps) {
        return this.toResult<T>(() =>
            this.request<T>("OPTIONS", url, undefined, init),
        );
    }

    /** Downloads a binary payload (accepts an absolute URL or a path). */
    public async getBlob(
        url: string,
        init?: CustomFetchProps,
    ): Promise<Result<Blob>> {
        return this.toResult<Blob>(() => this.requestBlob(url, init));
    }

    /** Returns a copy of this client bound to a different bearer token. */
    public withToken(token: string | null): HttpClient {
        return new HttpClient({
            ...this.config,
            token,
            defaultHeaders: { ...this.headers },
        });
    }

    /** Returns a copy of this client with extra default headers. */
    public withHeaders(headers: Record<string, string>): HttpClient {
        return new HttpClient({
            ...this.config,
            defaultHeaders: { ...this.headers, ...toHeaderRecord(headers) },
        });
    }

    /**
     * Merges into the default headers for subsequent requests.
     *
     * Mutates shared state, so two in-flight requests can observe different
     * headers — prefer {@link withHeaders}, which returns a new client.
     */
    public setHeaders(headers: Record<string, string>) {
        this.headers = { ...this.headers, ...toHeaderRecord(headers) };
    }

    public getHeaders(headers: Record<string, string> = {}) {
        return {
            ...BASE_HEADERS,
            ...this.headers,
            ...toHeaderRecord(headers),
        };
    }

    protected buildUrl(path: string) {
        if (/^[a-z][a-z\d+\-.]*:\/\//i.test(path)) return path;
        return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    }

    /** Issues the request, converting transport failures into `NetworkError`. */
    protected async send(
        method: string,
        url: string,
        body: unknown,
        init?: CustomFetchProps,
    ): Promise<Response> {
        const {
            timeout,
            signal,
            headers,
            body: initBody,
            ...rest
        } = init ?? {};

        const payload = serializeBody(body === undefined ? initBody : body);
        const requestHeaders = this.getHeaders({
            ...(payload.contentType
                ? { "content-type": payload.contentType }
                : {}),
            ...(this.config.token
                ? { authorization: `Bearer ${this.config.token}` }
                : {}),
            ...(await this.csrfHeader(method)),
            ...toHeaderRecord(headers),
        });

        // Cast because `next` and `cache` are Next.js extensions to `fetch`,
        // absent from every stock `RequestInit` — the DOM lib's and Node's alike.
        const requestInit = {
            ...rest,
            method,
            headers: requestHeaders,
            ...(payload.body !== undefined ? { body: payload.body } : {}),
            ...(this.composeSignal(signal, timeout) ?? {}),
        } as RequestInit;

        try {
            return await this.fetchImpl(url, requestInit);
        } catch (cause) {
            const name = cause instanceof Error ? cause.name : "";
            const aborted = name === "AbortError" || name === "TimeoutError";
            throw new NetworkError(
                aborted
                    ? `${method} ${url} foi cancelada${name === "TimeoutError" ? " por tempo esgotado" : ""}`
                    : `Não foi possível alcançar ${method} ${url}`,
                { url, method, cause },
            );
        }
    }

    protected async request<T>(
        method: string,
        path: string,
        body?: unknown,
        init?: CustomFetchProps,
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(path);
        const response = await this.send(method, url, body, init);
        return this.responseHandler<T>(response, url, method);
    }

    /**
     * Blob counterpart to {@link request}: bypasses {@link responseHandler} so the
     * payload is never parsed as text/JSON. Throws like the other internals —
     * {@link getBlob} converts it.
     */
    protected async requestBlob(
        path: string,
        init?: CustomFetchProps,
    ): Promise<ApiResponse<Blob>> {
        const url = this.buildUrl(path);
        const response = await this.send("GET", url, undefined, init);

        if (!isOk(response.status)) {
            throw httpErrorFor({
                status: response.status,
                statusText: response.statusText,
                url,
                method: "GET",
                data: await this.readBody(response, "GET").catch(() => null),
                retryAfter: this.readRetryAfter(response),
            });
        }

        return { status: response.status, data: await response.blob() };
    }

    protected async responseHandler<T>(
        response: Response,
        url: string,
        method: string,
    ): Promise<ApiResponse<T>> {
        if (isOk(response.status)) {
            try {
                const data = await this.readBody(response, method);
                return { status: response.status, data: data as T };
            } catch (cause) {
                throw new ParseError({
                    message: `Não foi possível interpretar a resposta de ${method} ${url}`,
                    status: response.status,
                    url,
                    method,
                    cause,
                });
            }
        }

        throw httpErrorFor({
            status: response.status,
            statusText: response.statusText,
            url,
            method,
            // An unreadable error body must not mask the status it came with.
            data: await this.readBody(response, method).catch(() => null),
            retryAfter: this.readRetryAfter(response),
        });
    }

    /**
     * Reads and parses the body.
     *
     * Returns `null` for empty responses rather than fabricating a payload — a
     * synthesised error object typed as `T` would be a lie the caller cannot
     * detect.
     */
    protected async readBody(
        response: Response,
        method: string,
    ): Promise<unknown> {
        if (method === "HEAD") return null;
        if ([204, 205, 304].includes(response.status)) return null;
        if (response.headers.get("content-length") === "0") return null;

        const text = await response.text();
        if (!text) return null;

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("json")) return JSON.parse(text);

        // No (or a non-JSON) content type: still try JSON, since DRF error handlers
        // occasionally answer without one, but keep the raw text if it isn't.
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    protected readRetryAfter(response: Response): number | null {
        const header = response.headers.get("retry-after");
        if (!header) return null;

        const seconds = Number(header);
        if (Number.isFinite(seconds)) return Math.max(0, Math.trunc(seconds));

        // `Retry-After` may also be an HTTP date.
        const date = Date.parse(header);
        if (Number.isNaN(date)) return null;
        return Math.max(0, Math.round((date - Date.now()) / 1000));
    }

    /** Builds the CSRF header for unsafe methods, when a token is available. */
    private async csrfHeader(method: string): Promise<Record<string, string>> {
        if (!this.config.getCsrfToken) return {};
        if (!UNSAFE_METHODS.has(method.toUpperCase())) return {};

        const token = await this.config.getCsrfToken();
        // `X-CSRFToken` is Django's `CSRF_HEADER_NAME` default; override
        // `CSRF_HEADER_NAME` on the backend if you need a different one.
        return token ? { "x-csrftoken": token } : {};
    }

    /**
     * Merges a caller's `signal` with the effective timeout, so whichever fires
     * first aborts the request.
     */
    private composeSignal(
        signal: CustomFetchProps["signal"],
        timeout?: number,
    ): { signal: AbortSignal } | undefined {
        const ms = timeout ?? this.config.timeout;
        if (ms === undefined || ms <= 0) return signal ? { signal } : undefined;

        const timeoutSignal = abortStatics.timeout?.(ms);
        if (!timeoutSignal) return signal ? { signal } : undefined;
        if (!signal) return { signal: timeoutSignal };

        // Fall back to the caller's signal where `any` is missing, rather than
        // dropping their ability to cancel.
        const composed = abortStatics.any?.([signal, timeoutSignal]);
        return { signal: composed ?? signal };
    }

    /** Turns a throwing internal into the {@link Result} the public API returns. */
    private async toResult<T>(
        run: () => Promise<ApiResponse<T>>,
    ): Promise<Result<T>> {
        try {
            const { status, data } = await run();
            return { ok: true, status, data };
        } catch (error) {
            // Anything not thrown by this package is a bug, not a request outcome.
            if (!isRestError(error)) throw error;
            const restError: AnyRestError = error;
            return { ok: false, status: restError.status, error: restError };
        }
    }
}

/** Convenience factory, for when you'd rather not write `new`. */
export const createRestClient = (config: HttpClientOptions) =>
    new HttpClient(config);
