import type { LoggerLinkOptions } from "@trpc/client";
import { TRPCClientError } from "@trpc/client";

import type { AppRouter } from "@te-inscreve/api";

import { env } from "~/shared/utils/env";

/**
 * Reporting for the tRPC client's `loggerLink`.
 *
 * A failure goes to exactly one surface: Next's error overlay in the browser
 * during development, the console everywhere else. Two surfaces would mean two
 * reports for the same failure, since Next promotes `console.error` into the
 * overlay as an entry of its own.
 */

type TRPCLoggerFn = NonNullable<LoggerLinkOptions<AppRouter>["logger"]>;

/** An operation that has come back, successfully or not. */
type CompletedOperation = Extract<
    Parameters<TRPCLoggerFn>[0],
    { direction: "down" }
>;

/** `NODE_ENV` is fixed at build time, so resolve it once. */
const isDevelopment = env.NODE_ENV === "development";

/**
 * The overlay is a development-only, browser-only surface. Under SSR the
 * deferred throw in {@link reportToErrorOverlay} would be an uncaught exception
 * in Node and take the dev server down with it.
 */
const canUseErrorOverlay = () => isDevelopment && typeof window !== "undefined";

/** Shows a failure in Next's error overlay, pointing at the code that threw. */
const reportToErrorOverlay = (
    op: CompletedOperation,
    error: TRPCClientError<AppRouter>,
) => {
    // No timing in the message: the overlay groups entries by message, so this
    // keeps a retried failure to one entry instead of one per attempt.
    const overlayError = new Error(
        `tRPC ${op.type} '${op.path}' failed: ${error.message}`,
        { cause: error },
    );

    // `data.stack` is the server stack, sent while the API runs outside
    // production; `error.stack` only covers the client link pipeline.
    overlayError.stack = error.data?.stack ?? error.stack;

    // `tap` calls its error handler *before* forwarding the error downstream and
    // does not guard against throws (see `observable/operators.ts` in
    // @trpc/server), so throwing synchronously would strand the query in
    // `pending` forever.
    setTimeout(() => {
        throw overlayError;
    });
};

/**
 * Console counterpart to {@link reportToErrorOverlay}. Mirrors the server-side
 * `>>> tRPC Error on '<path>'` log in `app/api/trpc/[trpc]/route.ts` so both
 * sides of a failure line up.
 */
const logFailure = (
    op: CompletedOperation,
    error: TRPCClientError<AppRouter>,
) => {
    console.error(`<<< tRPC Error on '${op.path}' in (${op.elapsedMs}ms)`, {
        code: error.data?.code,
        httpStatus: error.data?.httpStatus,
        message: error.message,
        type: op.type,
        // Inputs carry whatever the caller passed -- credentials, personal
        // data -- so they stay out of production logs, where this object may be
        // shipped to a log aggregator. In development they are the most useful
        // field here and never leave the machine.
        ...(isDevelopment ? { input: op.input } : {}),
        cause: error.cause,
    });
};

/**
 * Reports every failed operation exactly once, to whichever surface can show it
 * best. Successful operations only leave a terse trace in development.
 */
const trpcLogger: TRPCLoggerFn = (op) => {
    const trace = `${op.type} #${op.id} '${op.path}'`;

    if (op.direction === "up") {
        return;
    }

    if (op.result instanceof TRPCClientError) {
        if (canUseErrorOverlay()) {
            reportToErrorOverlay(op, op.result);
        } else {
            logFailure(op, op.result);
        }
        return;
    }

    if (isDevelopment) {
        console.debug(`<< tRPC ${trace} in (${op.elapsedMs}ms)`, op.result);
        return;
    }
};

/**
 * Which operations reach {@link trpcLogger}, and what it does with them. Kept
 * together because `enabled` is what guarantees a failure is always reported,
 * while everything else is development-only noise.
 */
export const loggerLinkOptions: LoggerLinkOptions<AppRouter> = {
    logger: trpcLogger,
    enabled: (op) =>
        isDevelopment ||
        (op.direction === "down" && op.result instanceof TRPCClientError),
};
