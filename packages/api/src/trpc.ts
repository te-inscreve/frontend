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
 * through `ctx.rest`, which is already carrying the signed-in user's JWT.
 *
 * @see https://trpc.io/docs/server/context
 */
const createTRPCContext = async (opts: {
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
        rest: opts.restClient.withToken(token),
    };
};

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
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
 */
const restErrorMiddleware = t.middleware(async ({ next }) => {
    try {
        return await next();
    } catch (error) {
        throw toTRPCError(error);
    }
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
const protectedProcedure = t.procedure
    .use(restErrorMiddleware)
    .use(({ ctx, next }) => {
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

export {
    createTRPCContext,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
    type TRPCContext,
};
