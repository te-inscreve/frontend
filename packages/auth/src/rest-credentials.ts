import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod/v4";

import type { HttpClient } from "@te-inscreve/rest";
import { matchHttpError } from "@te-inscreve/rest";

/**
 * Shape this monorepo expects back from the backend's login/register endpoints.
 *
 * If your REST API answers with something else, don't fight it — pass a custom
 * `parseAuthResponse` to `restCredentials()` and map it here, at the boundary.
 */
export const restAuthResponseSchema = z.object({
    token: z.string().min(1),
    user: z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        email: z.string(),
        name: z.string().nullish(),
        image: z.string().nullish(),
        emailVerified: z.boolean().nullish(),
    }),
});

export type RestAuthResponse = z.infer<typeof restAuthResponseSchema>;

/**
 * The endpoint context better-auth hands to plugin handlers. Derived from the
 * public `setSessionCookie` signature so we don't depend on `@better-auth/core`
 * internals, which aren't re-exported from `better-auth/types`.
 */
type AuthEndpointContext = Parameters<typeof setSessionCookie>[0];

export interface RestCredentialsOptions {
    /** REST client pointed at the backend API. */
    restClient: HttpClient;
    /** Backend routes that mint a JWT. Override to match your API. */
    paths?: {
        /** @default "/auth/login" */
        signIn?: string;
        /** @default "/auth/register" */
        signUp?: string;
    };
    /**
     * Turns the raw backend payload into `{ token, user }`.
     * @default parses with `restAuthResponseSchema`
     */
    parseAuthResponse?: (raw: unknown) => RestAuthResponse;
    /**
     * Fallback session lifetime, in seconds, used when the JWT carries no `exp`.
     * @default 7 days
     */
    sessionMaxAge?: number;
}

/**
 * Reads `exp` out of a JWT **without verifying it**.
 *
 * Verification is the backend's job — it issued the token and it is the only
 * party holding the signing key. We only peek at `exp` so the session cookie
 * never outlives the token it carries.
 */
function readJwtExpiry(token: string): Date | null {
    const payload = token.split(".")[1];
    if (!payload) return null;

    try {
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "=",
        );
        const decoded = JSON.parse(atob(padded)) as { exp?: unknown };
        if (typeof decoded.exp !== "number") return null;
        return new Date(decoded.exp * 1000);
    } catch {
        return null;
    }
}

/**
 * Maps a failed auth call onto a status the client can act on, without echoing
 * internal details for errors the user can't do anything about.
 *
 * Uses `matchHttpError` so every case is spelled out — if the REST package ever
 * grows a new error class, this stops compiling instead of silently falling
 * through to a 500.
 */
function toApiError(error: unknown, fallbackMessage: string): APIError {
    const unauthorized = () =>
        new APIError("UNAUTHORIZED", { message: fallbackMessage });
    const internal = (logged: unknown) => {
        console.error("[auth] REST call failed", logged);
        return new APIError("INTERNAL_SERVER_ERROR", {
            message: fallbackMessage,
        });
    };

    return matchHttpError(error, {
        // Credentials rejected. 404 is folded in deliberately: a missing user must
        // not be distinguishable from a wrong password.
        unauthorized,
        forbidden: unauthorized,
        notFound: unauthorized,
        // Validation problems are safe to relay verbatim.
        badRequest: (e) => new APIError("BAD_REQUEST", { message: e.message }),
        unprocessable: (e) =>
            new APIError("BAD_REQUEST", { message: e.message }),
        // Sign-up against an existing account.
        conflict: (e) => new APIError("CONFLICT", { message: e.message }),
        tooManyRequests: (e) =>
            new APIError("TOO_MANY_REQUESTS", { message: e.message }),
        server: internal,
        network: internal,
        notAcceptable: internal,
        otherwise: internal,
    });
}

/**
 * Signs users in against the backend REST API and stores the resulting JWT
 * inside better-auth's (stateless, encrypted) session cookie.
 *
 * The JWT lives in `session.token`, which is exactly where `packages/api` reads
 * it from to authorize outgoing REST calls. No database is involved anywhere:
 * the cookie *is* the session store, and the backend remains the single source
 * of truth for identity.
 */
export const restCredentials = (options: RestCredentialsOptions) => {
    const signInPath = options.paths?.signIn ?? "/auth/login";
    const signUpPath = options.paths?.signUp ?? "/auth/register";
    const sessionMaxAge = options.sessionMaxAge ?? 60 * 60 * 24 * 7;
    const parseAuthResponse =
        options.parseAuthResponse ??
        ((raw: unknown) => restAuthResponseSchema.parse(raw));

    /** Builds the better-auth session/user pair and writes the session cookie. */
    const establishSession = async (ctx: AuthEndpointContext, raw: unknown) => {
        let parsed: RestAuthResponse;
        try {
            parsed = parseAuthResponse(raw);
        } catch (cause) {
            console.error("[auth] unexpected auth payload from the API", cause);
            throw new APIError("INTERNAL_SERVER_ERROR", {
                message:
                    "The API returned an unexpected auth payload. Adjust `restAuthResponseSchema` or pass `parseAuthResponse`.",
            });
        }

        const now = new Date();
        const expiresAt =
            readJwtExpiry(parsed.token) ??
            new Date(now.getTime() + sessionMaxAge * 1000);

        const user = {
            id: parsed.user.id,
            email: parsed.user.email,
            name: parsed.user.name ?? "",
            image: parsed.user.image ?? null,
            emailVerified: parsed.user.emailVerified ?? false,
            createdAt: now,
            updatedAt: now,
        };

        const session = {
            // Stateless: there is no session row, so the session is identified by
            // the user it belongs to.
            id: parsed.user.id,
            // The backend JWT. `packages/api` pulls it back out of here.
            token: parsed.token,
            userId: parsed.user.id,
            expiresAt,
            createdAt: now,
            updatedAt: now,
            ipAddress: ctx.headers?.get("x-forwarded-for") ?? "",
            userAgent: ctx.headers?.get("user-agent") ?? "",
        };

        await setSessionCookie(ctx, { session, user });

        return { user, token: parsed.token };
    };

    return {
        id: "rest-credentials",
        endpoints: {
            /** `POST /api/auth/sign-in/rest` → `authClient.signIn.rest(...)` */
            signInRest: createAuthEndpoint(
                "/sign-in/rest",
                {
                    method: "POST",
                    body: z.object({
                        email: z.string(),
                        password: z.string(),
                    }),
                },
                async (ctx) => {
                    let data: unknown;
                    try {
                        // `withToken(null)` so a stale bearer never rides along on a login.
                        ({ data } = await options.restClient
                            .withToken(null)
                            .post(signInPath, {
                                email: ctx.body.email,
                                password: ctx.body.password,
                            }));
                    } catch (error) {
                        throw toApiError(error, "Invalid e-mail or password.");
                    }
                    return ctx.json(await establishSession(ctx, data));
                },
            ),

            /** `POST /api/auth/sign-up/rest` → `authClient.signUp.rest(...)` */
            signUpRest: createAuthEndpoint(
                "/sign-up/rest",
                {
                    method: "POST",
                    body: z.object({
                        name: z.string(),
                        email: z.string(),
                        password: z.string(),
                    }),
                },
                async (ctx) => {
                    let data: unknown;
                    try {
                        ({ data } = await options.restClient
                            .withToken(null)
                            .post(signUpPath, {
                                name: ctx.body.name,
                                email: ctx.body.email,
                                password: ctx.body.password,
                            }));
                    } catch (error) {
                        throw toApiError(
                            error,
                            "Could not create the account.",
                        );
                    }
                    return ctx.json(await establishSession(ctx, data));
                },
            ),
        },
    } satisfies BetterAuthPlugin;
};

export type RestCredentialsPlugin = ReturnType<typeof restCredentials>;
