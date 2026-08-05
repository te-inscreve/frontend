import type { CustomFetchProps } from "../types/http";

/**
 * Sent on every request unless overridden. `Content-Type` is deliberately absent
 * — it is derived from the body, so a `FormData` upload keeps the multipart
 * boundary `fetch` generates for it.
 */
export const BASE_HEADERS: Record<string, string> = {
    accept: "application/json",
    "accept-language": "pt-br",
};

/** Methods Django expects a CSRF token on. */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Normalizes any `fetch` header input to a lower-cased record. */
export const toHeaderRecord = (
    headers: CustomFetchProps["headers"],
): Record<string, string> => {
    if (!headers) return {};
    const record: Record<string, string> = {};
    new Headers(headers).forEach((value, key) => {
        record[key] = value;
    });
    return record;
};

export type GetCsrfToken = () =>
    string | null | undefined | Promise<string | null | undefined>;

/** Builds the CSRF header for unsafe methods, when a token is available. */
export async function csrfHeader(
    method: string,
    getCsrfToken: GetCsrfToken | undefined,
): Promise<Record<string, string>> {
    if (!getCsrfToken) return {};
    if (!UNSAFE_METHODS.has(method.toUpperCase())) return {};

    const token = await getCsrfToken();
    // `X-CSRFToken` is Django's `CSRF_HEADER_NAME` default; override
    // `CSRF_HEADER_NAME` on the backend if you need a different one.
    return token ? { "x-csrftoken": token } : {};
}

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
 * Matched on `Symbol.toStringTag` rather than with `instanceof`, which would
 * need a `typeof FormData !== "undefined"` probe per type — none of these is
 * guaranteed to exist on every runtime this package targets. Reading the tag
 * touches no globals, and is immune to the duplicated-realm problem that makes
 * `instanceof` unreliable here anyway.
 */
const RAW_BODY_TAGS = new Set([
    "ArrayBuffer",
    "Blob",
    "File",
    "FormData",
    "ReadableStream",
    "URLSearchParams",
]);

const isRawBody = (value: unknown): value is RawBody =>
    typeof value === "string" ||
    ArrayBuffer.isView(value) ||
    RAW_BODY_TAGS.has(Object.prototype.toString.call(value).slice(8, -1));

export const serializeBody = (
    body: unknown,
): { body?: RawBody; contentType?: string } => {
    if (body === undefined || body === null) return {};
    // `fetch` derives the `Content-Type` of these itself — that is what keeps a
    // `FormData` upload's multipart boundary intact.
    if (isRawBody(body)) return { body };
    // Everything else is JSON. Unrecognized objects must land here and not in
    // `fetch`, which would stringify them to `[object Object]` without a word.
    return { body: JSON.stringify(body), contentType: "application/json" };
};

export interface Timeout {
    signal: AbortSignal;
    /** True once the deadline fired — distinguishes it from a caller's abort. */
    expired: () => boolean;
    /** Clears the timer and detaches from `outer`. Safe to call more than once. */
    done: () => void;
}

/**
 * Aborts after `ms`, or as soon as `outer` aborts — whichever comes first.
 *
 * Built from a plain `AbortController` rather than `AbortSignal.timeout`/`any`,
 * which React Native's type definitions don't declare and older Hermes builds
 * don't ship. This works everywhere with no feature detection.
 */
export function abortAfter(ms: number, outer?: AbortSignal | null): Timeout {
    const ctrl = new AbortController();
    let expired = false;

    const timer = setTimeout(() => {
        expired = true;
        ctrl.abort();
    }, ms);

    const onOuterAbort = () => ctrl.abort();
    if (outer?.aborted) ctrl.abort();
    else outer?.addEventListener("abort", onOuterAbort, { once: true });

    return {
        signal: ctrl.signal,
        expired: () => expired,
        done: () => {
            clearTimeout(timer);
            outer?.removeEventListener("abort", onOuterAbort);
        },
    };
}
