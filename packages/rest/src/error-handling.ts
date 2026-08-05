import type {
    AnyRestError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    HttpError,
    NetworkError,
    NotAcceptableError,
    NotFoundError,
    ParseError,
    ServerError,
    TooManyRequestsError,
    UnauthorizedError,
    UnprocessableEntityError,
} from "./errors";

/**
 * Type guard for anything produced by this package.
 *
 * Brand-based rather than `instanceof`, so it still works when a bundler has
 * duplicated this module across chunks — see `RestError.__restError`.
 */
export const isRestError = (error: unknown): error is AnyRestError =>
    typeof error === "object" &&
    error !== null &&
    (error as { __restError?: unknown }).__restError === true;

/** Type guard for a non-2xx response. */
export const isHttpError = (error: unknown): error is HttpError =>
    isRestError(error) && error.kind === "http";

/** Type guard for a transport failure (the request never landed). */
export const isNetworkError = (error: unknown): error is NetworkError =>
    isRestError(error) && error.kind === "network";

/** Type guard for an unparseable 2xx body. */
export const isParseError = (error: unknown): error is ParseError =>
    isRestError(error) && error.kind === "parse";

/**
 * Every branch a caller must account for. All handlers are **required** — that
 * is the point: forgetting `unauthorized` is a compile error, not a bug you
 * find in production.
 */
export interface HttpErrorHandlers<R> {
    badRequest: (error: BadRequestError) => R;
    unauthorized: (error: UnauthorizedError) => R;
    forbidden: (error: ForbiddenError) => R;
    notFound: (error: NotFoundError) => R;
    notAcceptable: (error: NotAcceptableError) => R;
    conflict: (error: ConflictError) => R;
    unprocessable: (error: UnprocessableEntityError) => R;
    tooManyRequests: (error: TooManyRequestsError) => R;
    server: (error: ServerError) => R;
    network: (error: NetworkError) => R;
    /** Unnamed statuses, parse failures, and anything not from this package. */
    otherwise: (error: unknown) => R;
}

/**
 * Exhaustively handles a `Result`'s `error` (or anything from a `catch` block).
 * See `packages/rest/README.md` for a worked example.
 */
export function matchHttpError<R>(
    error: unknown,
    handlers: HttpErrorHandlers<R>,
): R {
    if (isNetworkError(error)) return handlers.network(error);

    if (isHttpError(error)) {
        // Casts, not `instanceof`: the status *is* the identity of these classes,
        // and a duplicated module would break the prototype check.
        switch (error.status) {
            case 400:
                return handlers.badRequest(error as BadRequestError);
            case 401:
                return handlers.unauthorized(error);
            case 403:
                return handlers.forbidden(error);
            case 404:
                return handlers.notFound(error);
            case 406:
                return handlers.notAcceptable(error);
            case 409:
                return handlers.conflict(error);
            case 422:
                return handlers.unprocessable(
                    error as UnprocessableEntityError,
                );
            case 429:
                return handlers.tooManyRequests(error as TooManyRequestsError);
        }

        if (error.status >= 500) return handlers.server(error);
    }

    return handlers.otherwise(error);
}
