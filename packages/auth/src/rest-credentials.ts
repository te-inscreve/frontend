import type { BetterAuthPlugin } from "better-auth";
import {
    APIError,
    createAuthEndpoint,
    createAuthMiddleware,
    getSessionFromCtx,
} from "better-auth/api";
import {
    deleteSessionCookie,
    expireCookie,
    setSessionCookie,
} from "better-auth/cookies";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { z } from "zod/v4";

import type { HttpClient, HttpError } from "@te-inscreve/rest";
import { isHttpError, matchHttpError } from "@te-inscreve/rest";

const REFRESH_COOKIE_NAME = "rest_refresh";
const REFRESH_WINDOW_MS = 60 * 1000;

/**
 * Shape this monorepo expects back from the backend's login/register endpoints.
 *
 * If your REST API answers with something else, don't fight it — pass a custom
 * `parseAuthResponse` to `restCredentials()` and map it here, at the boundary.
 */
export const restAuthResponseSchema = z.object({
    token: z.string().min(1),
    refreshToken: z.string().min(1).optional(),
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
        /** @default "/auth/registration" */
        signUp?: string;
        /** @default "/auth/token/refresh" */
        refresh?: string;
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

const storedUserSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    emailVerified: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

const storedRefreshSchema = z.object({
    refreshToken: z.string().min(1),
    expiresAt: z.number(),
    user: storedUserSchema,
});

const refreshedTokenSchema = z.object({
    access: z.string().min(1),
    refresh: z.string().min(1).optional(),
});

/**
 * Body for a rejection the user can fix, carrying the backend's per-field
 * detail so a form can bind each message to its own input.
 *
 * `fieldErrors` is keyed by the *backend's* field names (`email`, `cpf`, …)
 * with non-field errors under `""`. Translating those keys to whatever the
 * form calls its inputs is the UI's job — this layer doesn't know them.
 *
 * The key is omitted when the body carried no field detail, so the client can
 * branch on its presence instead of on an empty object.
 */
function validationBody(error: HttpError) {
    const fieldErrors = error.fieldErrors;

    return Object.keys(fieldErrors).length > 0
        ? { message: error.message, fieldErrors }
        : { message: error.message };
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
        // Validation problems are safe to relay verbatim, field detail included.
        badRequest: (e) => new APIError("BAD_REQUEST", validationBody(e)),
        unprocessable: (e) => new APIError("BAD_REQUEST", validationBody(e)),
        // Sign-up against an existing account.
        conflict: (e) => new APIError("CONFLICT", validationBody(e)),
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
    const signUpPath = options.paths?.signUp ?? "/auth/registration";
    const refreshPath = options.paths?.refresh ?? "/auth/token/refresh";
    const sessionMaxAge = options.sessionMaxAge ?? 60 * 60 * 24 * 7;
    const parseAuthResponse =
        options.parseAuthResponse ??
        ((raw: unknown) => restAuthResponseSchema.parse(raw));

    const getRefreshCookie = (ctx: AuthEndpointContext, maxAge?: number) =>
        ctx.context.createAuthCookie(REFRESH_COOKIE_NAME, { maxAge });

    const clearSession = (ctx: AuthEndpointContext) => {
        deleteSessionCookie(ctx);
        expireCookie(ctx, getRefreshCookie(ctx));
    };

    const setRefreshCookie = async (
        ctx: AuthEndpointContext,
        refreshToken: string,
        user: z.infer<typeof storedUserSchema>,
    ) => {
        const now = Date.now();
        const expiresAt =
            readJwtExpiry(refreshToken)?.getTime() ??
            now + sessionMaxAge * 1000;
        const maxAge = Math.max(0, Math.floor((expiresAt - now) / 1000));
        const cookie = getRefreshCookie(ctx, maxAge);
        const value = await symmetricEncrypt({
            key: ctx.context.secretConfig,
            data: JSON.stringify({ refreshToken, expiresAt, user }),
        });

        ctx.setCookie(cookie.name, value, cookie.attributes);
    };

    const readRefreshCookie = async (ctx: AuthEndpointContext) => {
        const cookie = getRefreshCookie(ctx);
        const value = ctx.getCookie(cookie.name);
        if (!value) return null;

        try {
            const decrypted = await symmetricDecrypt({
                key: ctx.context.secretConfig,
                data: value,
            });
            const stored = storedRefreshSchema.parse(JSON.parse(decrypted));
            if (stored.expiresAt <= Date.now()) {
                expireCookie(ctx, cookie);
                return null;
            }
            return stored;
        } catch (cause) {
            ctx.context.logger.warn(
                "Ignoring an invalid REST refresh cookie",
                cause,
            );
            expireCookie(ctx, cookie);
            return null;
        }
    };

    const writeSession = async (
        ctx: AuthEndpointContext,
        token: string,
        refreshToken: string | undefined,
        user: z.infer<typeof storedUserSchema>,
    ) => {
        const now = new Date();
        const expiresAt =
            readJwtExpiry(token) ??
            new Date(now.getTime() + sessionMaxAge * 1000);
        const session = {
            id: user.id,
            token,
            userId: user.id,
            expiresAt,
            createdAt: now,
            updatedAt: now,
            ipAddress: ctx.headers?.get("x-forwarded-for") ?? "",
            userAgent: ctx.headers?.get("user-agent") ?? "",
        };

        await setSessionCookie(ctx, { session, user });
        if (refreshToken) await setRefreshCookie(ctx, refreshToken, user);

        return { session, user };
    };

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
        const user = {
            id: parsed.user.id,
            email: parsed.user.email,
            name: parsed.user.name ?? "",
            image: parsed.user.image ?? null,
            emailVerified: parsed.user.emailVerified ?? false,
            createdAt: now,
            updatedAt: now,
        };

        await writeSession(ctx, parsed.token, parsed.refreshToken, user);

        return { user, token: parsed.token };
    };

    const refreshSession = async (ctx: AuthEndpointContext) => {
        const stored = await readRefreshCookie(ctx);
        if (!stored) return null;

        const result = await options.restClient
            .withToken(null)
            .post<unknown>(refreshPath, {
                refresh: stored.refreshToken,
            });

        if (!result.ok) {
            if (isHttpError(result.error) && result.error.status === 401) {
                clearSession(ctx);
                return null;
            }
            throw toApiError(result.error, "Could not refresh the session.");
        }

        let refreshed: z.infer<typeof refreshedTokenSchema>;
        try {
            refreshed = refreshedTokenSchema.parse(result.data);
        } catch (cause) {
            console.error("[auth] unexpected token refresh payload", cause);
            throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "The API returned an invalid token refresh payload.",
            });
        }

        const refreshToken = refreshed.refresh ?? stored.refreshToken;
        return writeSession(ctx, refreshed.access, refreshToken, stored.user);
    };

    /**
     * Calls a backend auth route and returns its payload.
     *
     * `@te-inscreve/rest` reports failures as a `Result` rather than throwing, so
     * the status has to be narrowed here — a `try/catch` would never fire and a
     * rejected login would reach `establishSession` as `undefined`.
     */
    const requestAuth = async (
        path: string,
        body: unknown,
        fallbackMessage: string,
    ): Promise<unknown> => {
        // `withToken(null)` so a stale bearer never rides along on a login.
        const result = await options.restClient
            .withToken(null)
            .post<unknown>(path, body);

        if (!result.ok) throw toApiError(result.error, fallbackMessage);

        return result.data;
    };

    return {
        id: "rest-credentials",
        hooks: {
            after: [
                {
                    matcher: (ctx) => ctx.path === "/sign-out",
                    handler: createAuthMiddleware((ctx) => {
                        expireCookie(ctx, getRefreshCookie(ctx));
                        return Promise.resolve();
                    }),
                },
            ],
        },
        endpoints: {
            getSession: createAuthEndpoint(
                "/get-session",
                {
                    method: "GET",
                    query: z
                        .object({
                            disableCookieCache: z.coerce.boolean().optional(),
                            disableRefresh: z.coerce.boolean().optional(),
                        })
                        .optional(),
                    requireHeaders: true,
                },
                async (ctx) => {
                    const accessToken = await ctx.getSignedCookie(
                        ctx.context.authCookies.sessionToken.name,
                        ctx.context.secret,
                    );
                    const expiresAt = accessToken
                        ? readJwtExpiry(accessToken)?.getTime()
                        : null;
                    const shouldRefresh =
                        !ctx.query?.disableRefresh &&
                        (expiresAt == null ||
                            expiresAt - Date.now() <= REFRESH_WINDOW_MS);

                    if (shouldRefresh) {
                        try {
                            const refreshed = await refreshSession(ctx);
                            if (refreshed) return ctx.json(refreshed);
                        } catch (cause) {
                            if (expiresAt == null || expiresAt <= Date.now()) {
                                throw cause;
                            }
                            ctx.context.logger.warn(
                                "Token refresh failed; using the access token until it expires",
                                cause,
                            );
                        }
                    }

                    const session = await getSessionFromCtx(ctx);
                    return ctx.json(session);
                },
            ),

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
                    const data = await requestAuth(
                        signInPath,
                        {
                            email: ctx.body.email,
                            password: ctx.body.password,
                        },
                        "Invalid e-mail or password.",
                    );
                    return ctx.json(await establishSession(ctx, data));
                },
            ),

            /**
             * `POST /api/auth/sign-up/rest` → `authClient.signUp.rest(...)`
             *
             * The body mirrors the backend's registration serializer field for
             * field — including `passwordVerification`, which the API checks
             * itself. Validation is *not* re-done here: the fields are relayed
             * as-is so a rule change on the backend surfaces as its own 400
             * instead of being rejected by a stale copy of the rule.
             */
            signUpRest: createAuthEndpoint(
                "/sign-up/rest",
                {
                    method: "POST",
                    body: z.object({
                        email: z.string(),
                        fullName: z.string(),
                        cpf: z.string(),
                        password: z.string(),
                        passwordVerification: z.string(),
                    }),
                },
                async (ctx) => {
                    const data = await requestAuth(
                        signUpPath,
                        {
                            email: ctx.body.email,
                            fullName: ctx.body.fullName,
                            cpf: ctx.body.cpf,
                            password: ctx.body.password,
                            passwordVerification: ctx.body.passwordVerification,
                        },
                        "Could not create the account.",
                    );
                    return ctx.json(await establishSession(ctx, data));
                },
            ),
        },
    } satisfies BetterAuthPlugin;
};

export type RestCredentialsPlugin = ReturnType<typeof restCredentials>;
