import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/unstable-core-do-not-import";
import { TRPCError } from "@trpc/server";

import {
    isHttpError,
    isNetworkError,
    isParseError,
    isRestError,
} from "@te-inscreve/rest";

const STATUS_TO_TRPC: Record<number, TRPC_ERROR_CODE_KEY> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_SUPPORTED",
    408: "TIMEOUT",
    409: "CONFLICT",
    412: "PRECONDITION_FAILED",
    413: "PAYLOAD_TOO_LARGE",
    422: "UNPROCESSABLE_CONTENT",
    429: "TOO_MANY_REQUESTS",
    499: "CLIENT_CLOSED_REQUEST",
};

/**
 * Carries Django's per-field validation errors alongside the tRPC error so the
 * client can bind them to form inputs. Surfaced as `error.data.fieldErrors`
 * by the `errorFormatter` in `trpc.ts`.
 */
export class ApiValidationError extends Error {
    readonly fieldErrors: Record<string, string[]>;

    constructor(message: string, fieldErrors: Record<string, string[]>) {
        super(message);
        this.name = "ApiValidationError";
        this.fieldErrors = fieldErrors;
    }
}

/**
 * Converts anything thrown by `@te-inscreve/rest` into the equivalent tRPC
 * error. This is the single place where backend HTTP semantics become tRPC
 * semantics, so clients never reason about status codes.
 *
 * Applied automatically by the middleware in `trpc.ts` — procedures just let
 * errors propagate.
 */
export function toTRPCError(error: unknown): TRPCError {
    if (error instanceof TRPCError) return error;

    if (isNetworkError(error)) {
        return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The te inscreve API is unreachable.",
            cause: error,
        });
    }

    if (isParseError(error)) {
        return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The te inscreve API returned an unexpected payload.",
            cause: error,
        });
    }

    if (isHttpError(error)) {
        const fieldErrors = error.fieldErrors;

        // Keep Django's per-field detail when there is any.
        if (Object.keys(fieldErrors).length > 0) {
            return new TRPCError({
                code: STATUS_TO_TRPC[error.status] ?? "BAD_REQUEST",
                message: error.message,
                cause: new ApiValidationError(error.message, fieldErrors),
            });
        }

        const code = STATUS_TO_TRPC[error.status];
        if (code) {
            return new TRPCError({
                code,
                message: error.message,
                cause: error,
            });
        }

        // 5xx and anything unmapped: don't leak backend internals to clients.
        return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The te inscreve API failed to handle this request.",
            cause: error,
        });
    }

    if (isRestError(error)) {
        return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The te inscreve API call failed.",
            cause: error,
        });
    }

    return new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error,
    });
}
