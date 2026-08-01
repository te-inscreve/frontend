/**
 * Everything `fetch` accepts except `method`, which each client helper sets.
 *
 * Forwarded verbatim to `fetch`, so Next.js cache directives work:
 *
 * ```ts
 * await client.get("/eventos", { next: { revalidate: 10, tags: ["eventos"] } });
 * // later
 * revalidateTag("eventos");
 * ```
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/fetch
 * @see https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */
export type CustomFetchProps = Omit<RequestInit, "method"> & {
    /**
     * Next.js-only fetch extensions. Declared explicitly because the base
     * `RequestInit` type doesn't carry them outside a Next build, and this
     * package is also consumed by React Native.
     */
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
    /**
     * Declared for the same reason as {@link CustomFetchProps.next}: `cache` is
     * part of the browser/Next `fetch` contract but absent from the `RequestInit`
     * that ships with `@types/node`.
     */
    cache?:
        | "default"
        | "force-cache"
        | "no-cache"
        | "no-store"
        | "only-if-cached"
        | "reload";
    /**
     * Abort the request after this many milliseconds. Composed with any `signal`
     * you pass, so whichever fires first wins.
     */
    timeout?: number;
};

/** One entry of a Django REST Framework error response. */
export interface ApiErrorDetail {
    code: string;
    /** Human-readable message. */
    detail: string;
    /** Offending field name, or `null` for non-field errors. */
    attr: string | null;
}

/**
 * DRF's standardized error envelope, as produced by `drf-standardized-errors`.
 *
 * @example
 * ```json
 * {
 *   "type": "validation_error",
 *   "errors": [{ "code": "blank", "detail": "Não pode ser em branco.", "attr": "nome" }]
 * }
 * ```
 */
export interface ResponseError {
    type: "validation_error" | "client_error" | "server_error" | (string & {});
    errors: ApiErrorDetail[];
}

/**
 * DRF's *raw* (non-standardized) validation format: a dict keyed by field name.
 * Supported alongside {@link ResponseError} because serializers configured
 * without `drf-standardized-errors` still emit this shape.
 */
export type ValidationError = Record<string, string[] | ValidationError[]>;

/** Successful result of a request. */
export interface ApiResponse<T> {
    status: number;
    data: T;
}

/**
 * Documents which body shape corresponds to which status.
 *
 * Kept as documentation of the API contract — deliberately *not* used to cast a
 * real `Response`, since a cast like that only asserts a shape the runtime has
 * not verified.
 */
export type CustomResponse<T> =
    | { status: 200 | 201 | 202 | 204; body: T }
    | { status: 400 | 422; body: ResponseError | ValidationError }
    | {
          status: 401 | 403 | 404 | 406 | 409 | 429 | 500 | 502 | 503;
          body: ResponseError;
      };

/** True when `status` is in the 2xx range. */
export const isOk = (status: number) => status >= 200 && status < 300;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Narrows an unknown body to DRF's standardized error envelope. */
export function isResponseError(body: unknown): body is ResponseError {
    if (!isPlainObject(body)) return false;
    if (typeof body.type !== "string") return false;
    return (
        Array.isArray(body.errors) &&
        body.errors.every(
            (entry) => isPlainObject(entry) && typeof entry.detail === "string",
        )
    );
}

/** Narrows an unknown body to DRF's raw field-keyed validation format. */
export function isValidationError(body: unknown): body is ValidationError {
    if (!isPlainObject(body)) return false;
    if (isResponseError(body)) return false;

    const values = Object.values(body);
    return (
        values.length > 0 &&
        values.every(
            (value) =>
                Array.isArray(value) &&
                value.every(
                    (entry) =>
                        typeof entry === "string" || isPlainObject(entry),
                ),
        )
    );
}

/**
 * Groups errors by field name, ready to bind to a form. Non-field errors land
 * under the `""` key. Handles both DRF error shapes.
 */
export function toFieldErrors(body: unknown): Record<string, string[]> {
    const fields: Record<string, string[]> = {};

    const push = (key: string, message: string) => {
        (fields[key] ??= []).push(message);
    };

    if (isResponseError(body)) {
        for (const entry of body.errors) {
            push(entry.attr ?? "", entry.detail);
        }
        return fields;
    }

    if (isValidationError(body)) {
        const walk = (value: ValidationError, prefix: string) => {
            for (const [key, messages] of Object.entries(value)) {
                const path = prefix ? `${prefix}.${key}` : key;
                for (const message of messages) {
                    // Nested serializers answer with a dict per item, e.g.
                    // `{ "lotes": [{ "preco": ["..."] }] }`.
                    if (typeof message === "string") push(path, message);
                    else walk(message, path);
                }
            }
        };
        walk(body, "");
        return fields;
    }

    return fields;
}

/**
 * Best-effort human-readable message from any error body — a DRF envelope, a
 * field-keyed dict, `{detail}`/`{message}`, or a plain string.
 */
export function extractErrorMessage(body: unknown, fallback: string): string {
    if (typeof body === "string" && body.trim()) return body;

    if (isResponseError(body)) {
        return body.errors[0]?.detail ?? fallback;
    }

    if (isValidationError(body)) {
        const first = Object.values(toFieldErrors(body))[0];
        return first?.[0] ?? fallback;
    }

    if (isPlainObject(body)) {
        for (const key of ["detail", "message", "error"] as const) {
            const value = body[key];
            if (typeof value === "string" && value.trim()) return value;
        }
    }

    return fallback;
}
