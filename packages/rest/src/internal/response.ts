import type { Result } from "../types/client";
import { httpErrorFor, ParseError } from "../errors";
import { isOk } from "../types/http";

/**
 * Reads and parses the body.
 *
 * Returns `null` for empty responses rather than fabricating a payload — a
 * synthesised error object typed as `T` would be a lie the caller cannot
 * detect.
 */
export async function readBody(
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

export function readRetryAfter(response: Response): number | null {
    const header = response.headers.get("retry-after");
    if (!header) return null;

    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, Math.trunc(seconds));

    // `Retry-After` may also be an HTTP date.
    const date = Date.parse(header);
    if (Number.isNaN(date)) return null;
    return Math.max(0, Math.round((date - Date.now()) / 1000));
}

/**
 * Turns a `Response` into the {@link Result} the public API returns.
 *
 * Returns failures rather than throwing them, which is what keeps the client
 * free of a catch-and-rewrap layer: nothing below the public methods throws, so
 * anything that *does* escape is a real defect.
 */
export async function toResult<T>(
    response: Response,
    url: string,
    method: string,
): Promise<Result<T>> {
    if (isOk(response.status)) {
        try {
            return {
                ok: true,
                status: response.status,
                data: (await readBody(response, method)) as T,
            };
        } catch (cause) {
            return {
                ok: false,
                status: response.status,
                error: new ParseError({
                    message: `Não foi possível interpretar a resposta de ${method} ${url}`,
                    status: response.status,
                    url,
                    method,
                    cause,
                }),
            };
        }
    }

    return {
        ok: false,
        status: response.status,
        error: httpErrorFor({
            status: response.status,
            statusText: response.statusText,
            url,
            method,
            // An unreadable error body must not mask the status it came with.
            data: await readBody(response, method).catch(() => null),
            retryAfter: readRetryAfter(response),
        }),
    };
}
