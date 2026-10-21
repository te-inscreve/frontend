/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { Auth } from "@te-inscreve/auth";
import type { HttpClient } from "@te-inscreve/rest";

import { ApiValidationError, toTRPCError } from "./rest-error";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * There is no database here: every procedure talks to the backend REST API
 * through `ctx.restClient`, which is already carrying the signed-in user's JWT.
 *
 * @see https://trpc.io/docs/server/context
 */
const createTRPCServerContext = async (opts: {
    headers: Headers;
    auth: Auth;
    restClient: HttpClient;
}) => {
    const authApi = opts.auth.api;
    const session = await authApi.getSession({ headers: opts.headers });

    /**
     * The JWT the backend issued at login. `packages/auth` stashed it in
     * `session.token` inside the encrypted session cookie.
     */
    const token = session?.session.token ?? null;

    return {
        authApi,
        session,
        token,
        /** REST client bound to the current user — pass it straight through. */
        restClient: opts.restClient.withToken(token),
    };
};

type TRPCContext = Awaited<ReturnType<typeof createTRPCServerContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCServerContext>().create({
    transformer: superjson,
    errorFormatter: ({ shape, error }) => ({
        ...shape,
        data: {
            ...shape.data,
            zodError:
                error.cause instanceof ZodError
                    ? z.flattenError(
                          error.cause as ZodError<Record<string, unknown>>,
                      )
                    : null,
            /** Django per-field validation errors, ready to bind to a form. */
            fieldErrors:
                error.cause instanceof ApiValidationError
                    ? error.cause.fieldErrors
                    : null,
        },
    }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the `src/router` folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
const createTRPCRouter = t.router;

/**
 * Turns anything thrown by `@te-inscreve/rest` into the matching tRPC error, so
 * a 404 from Django reaches the client as NOT_FOUND rather than an opaque 500.
 *
 * This is what lets procedures stay one-liners: let the error propagate and it
 * is classified here. Catch it yourself only when a status is a *meaningful*
 * outcome (see `evento.byId`). Applied to every procedure below.
 *
 * `next()` never throws in tRPC v11: the resolver's error comes back as
 * `{ ok: false, error }`, already wrapped in a generic INTERNAL_SERVER_ERROR
 * with the original in `cause`. A `try`/`catch` around it never fires — that
 * is how every 400 used to reach the client as a 500 with no `fieldErrors`.
 * The classification has to read the result instead.
 */
const restErrorMiddleware = t.middleware(async ({ next }) => {
    const result = await next();
    if (result.ok) return result;

    return {
        ...result,
        error: toTRPCError(result.error.cause ?? result.error),
    };
});

const authenticatedMiddleware = t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user || !ctx.token) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            // infers `session` and `token` as non-nullable
            session: { ...ctx.session, user: ctx.session.user },
            token: ctx.token,
        },
    });
});

/** NOT IMPLEMENTED */
const authorizedMiddleware = t.middleware(() => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED" });
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
const publicProcedure = t.procedure.use(restErrorMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees `ctx.session.user` is
 * not null — and that `ctx.token` holds the backend JWT.
 *
 * @see https://trpc.io/docs/procedures
 */
const authenticatedProcedure = t.procedure
    .use(restErrorMiddleware)
    .use(authenticatedMiddleware);

/**
 * Authorized (staff) procedure
 *
 * If you want a query or mutation to ONLY be accessible to staff users, use
 * this. It verifies the session is valid and guarantees `ctx.session.user` is
 * not null — and that `ctx.token` holds the backend JWT.
 *
 * @see https://trpc.io/docs/procedures
 */
const authorizedProcedure = t.procedure
    .use(restErrorMiddleware)
    .use(authorizedMiddleware);

export {
    authenticatedProcedure,
    authorizedProcedure,
    createTRPCRouter,
    createTRPCServerContext,
    publicProcedure,
    type TRPCContext,
};
