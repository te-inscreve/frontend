import type { Result } from "./types/client";
import type { ResponseError, ValidationError } from "./types/http";
import { extractErrorMessage, toFieldErrors } from "./types/http";

/** Base class for every error this package produces. */
export abstract class RestError extends Error {
    /**
     * Brand that survives duplicate copies of this module.
     *
     * Bundlers inline a workspace package into every chunk that needs it, so the
     * same logical class can exist as several distinct class objects at runtime —
     * and `instanceof` is `false` across that boundary. (Turbopack does exactly
     * this: `HttpError` lands in three separate server chunks.) The guards in
     * `error-handling.ts` test this brand plus {@link kind}, which compare
     * correctly regardless.
     */
    readonly __restError = true as const;

    /** Discriminant for the guards. */
    abstract readonly kind: "network" | "http" | "parse";

    /** HTTP status, or `null` when the request never got a response. */
    abstract readonly status: number | null;

    readonly url: string;
    readonly method: string;

    constructor(
        message: string,
        opts: { url: string; method: string; cause?: unknown },
    ) {
        super(message, { cause: opts.cause });
        // Set explicitly by every subclass rather than derived from `new.target`,
        // which a minifier would rename to a single letter in a production build.
        this.name = "RestError";
        this.url = opts.url;
        this.method = opts.method;
    }
}

/**
 * The request never reached the API: DNS failure, connection refused, TLS
 * error, offline, or an aborted/timed-out request.
 *
 * Deliberately distinct from {@link HttpError} — a 500 means the server
 * answered, this means it never did, and the two usually warrant different
 * handling (retry vs. surface).
 */
export class NetworkError extends RestError {
    readonly kind = "network" as const;
    readonly status = null;

    constructor(
        message: string,
        opts: { url: string; method: string; cause?: unknown },
    ) {
        super(message, opts);
        this.name = "NetworkError";
    }
}

/** Options every status-specific error is built from. */
export interface HttpErrorOpts {
    message?: string;
    statusText?: string;
    url: string;
    method: string;
    data: unknown;
}

/** The API answered with a non-2xx status. */
export class HttpError extends RestError {
    readonly kind = "http" as const;
    readonly status: number;
    readonly statusText: string;
    /** Parsed response body, when there was one. */
    readonly data: unknown;

    constructor(opts: HttpErrorOpts & { status: number; fallback?: string }) {
        const statusText = opts.statusText ?? "";
        const fallback =
            opts.fallback ??
            `${opts.method} ${opts.url} retornou ${opts.status}${
                statusText ? ` - ${statusText}` : ""
            }`;

        super(opts.message ?? extractErrorMessage(opts.data, fallback), opts);
        this.name = "HttpError";
        this.status = opts.status;
        this.statusText = statusText;
        this.data = opts.data;
    }

    /**
     * Errors grouped by field name, ready to bind to a form. Empty when the body
     * carried no field-level detail. Handles both DRF error shapes.
     */
    get fieldErrors(): Record<string, string[]> {
        return toFieldErrors(this.data);
    }
}

export class BadRequestError extends HttpError {
    declare readonly data: ResponseError | ValidationError;

    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 400 });
        this.name = "BadRequestError";
    }
}

export class UnauthorizedError extends HttpError {
    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 401 });
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends HttpError {
    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 403 });
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends HttpError {
    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 404 });
        this.name = "NotFoundError";
    }
}

export class NotAcceptableError extends HttpError {
    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 406 });
        this.name = "NotAcceptableError";
    }
}

export class ConflictError extends HttpError {
    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 409 });
        this.name = "ConflictError";
    }
}

export class UnprocessableEntityError extends HttpError {
    declare readonly data: ResponseError | ValidationError;

    constructor(opts: HttpErrorOpts) {
        super({ ...opts, status: 422 });
        this.name = "UnprocessableEntityError";
    }
}

/** 429 — DRF throttling. */
export class TooManyRequestsError extends HttpError {
    /** Seconds to wait, from the `Retry-After` header, when the API sent one. */
    readonly retryAfter: number | null;

    constructor(opts: HttpErrorOpts & { retryAfter?: number | null }) {
        super({ ...opts, status: 429 });
        this.name = "TooManyRequestsError";
        this.retryAfter = opts.retryAfter ?? null;
    }
}

/** 5xx — the API failed to handle a valid request. */
export class ServerError extends HttpError {
    constructor(opts: HttpErrorOpts & { status: number }) {
        super(opts);
        this.name = "ServerError";
    }
}

/** A 2xx response whose body could not be parsed. */
export class ParseError extends RestError {
    readonly kind = "parse" as const;
    readonly status: number;

    constructor(opts: {
        message: string;
        status: number;
        url: string;
        method: string;
        cause?: unknown;
    }) {
        super(opts.message, opts);
        this.name = "ParseError";
        this.status = opts.status;
    }
}

/** Constructs the most specific error class for a status. */
export function httpErrorFor(opts: {
    status: number;
    statusText: string;
    url: string;
    method: string;
    data: unknown;
    retryAfter?: number | null;
}): HttpError {
    const { status, retryAfter, ...rest } = opts;

    switch (status) {
        case 400:
            return new BadRequestError(rest);
        case 401:
            return new UnauthorizedError(rest);
        case 403:
            return new ForbiddenError(rest);
        case 404:
            return new NotFoundError(rest);
        case 406:
            return new NotAcceptableError(rest);
        case 409:
            return new ConflictError(rest);
        case 422:
            return new UnprocessableEntityError(rest);
        case 429:
            return new TooManyRequestsError({ ...rest, retryAfter });
    }

    if (status >= 500) return new ServerError({ ...rest, status });

    return new HttpError({ ...rest, status });
}

/** Every concrete error this package can produce. */
export type AnyRestError = NetworkError | HttpError | ParseError;

/** Wraps a transport failure as the `Result` the public methods return. */
export function networkFailure(
    cause: unknown,
    method: string,
    url: string,
    timedOut: boolean,
): Result<never> {
    const name = cause instanceof Error ? cause.name : "";
    const aborted =
        timedOut || name === "AbortError" || name === "TimeoutError";
    const expired = timedOut || name === "TimeoutError";

    return {
        ok: false,
        status: null,
        error: new NetworkError(
            aborted
                ? `${method} ${url} foi cancelada${expired ? " por tempo esgotado" : ""}`
                : `Não foi possível alcançar ${method} ${url}`,
            { url, method, cause },
        ),
    };
}
