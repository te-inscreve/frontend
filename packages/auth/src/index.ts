import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

import type { HttpClient } from "@te-inscreve/rest";

import type { RestCredentialsOptions } from "./rest-credentials";
import { restCredentials } from "./rest-credentials";

export interface InitAuthOptions {
    /** Where this auth server is reachable, e.g. `http://localhost:3000`. */
    baseUrl: BetterAuthOptions["baseURL"];
    /** Signs & encrypts the session cookie. See `AUTH_SECRET`. */
    secret: string | undefined;
    /** REST client used to authenticate against the backend. */
    restClient: HttpClient;
    /** Custom paths / payload mapping for the backend auth routes. */
    restCredentials?: Omit<RestCredentialsOptions, "restClient">;
    /** Extra origins allowed to call this auth server (e.g. the Expo scheme). */
    trustedOrigins?: BetterAuthOptions["trustedOrigins"];
    /**
     * Framework plugins such as `nextCookies()`.
     *
     * Deliberately NOT generic: if the returned `Auth` type varied per call site,
     * `packages/api` (which refers to the default instantiation) and
     * `apps/nextjs` (which passes `nextCookies()`) would end up with two
     * structurally incompatible `Auth` types. Endpoints you need typed on the
     * client belong in the built-in `restCredentials` plugin instead.
     */
    extraPlugins?: BetterAuthPlugin[];
}

/**
 * better-auth configured for a **database-less** monorepo.
 *
 * The backend REST API owns identity: it validates credentials and issues the
 * JWT. better-auth's job here is session transport — it keeps that JWT in an
 * encrypted, tamper-proof cookie that both the Next.js app and the Expo app
 * can present, and hands it back to the tRPC layer on every request.
 *
 * Because no `database` is configured, better-auth runs in stateless mode:
 * `getSession()` decrypts the cookie instead of hitting a session table, and
 * expiry is enforced from the cookie payload. The trade-off is that sessions
 * can't be revoked server-side before they expire — the backend must reject the
 * JWT itself for that.
 */
export function initAuth(options: InitAuthOptions) {
    return betterAuth({
        // No `database`: better-auth stays stateless and never touches storage.
        baseURL: options.baseUrl,
        secret: options.secret,
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 60 * 60 * 24 * 7,
                // Encrypts the payload — the backend JWT rides inside this cookie, so
                // a merely-signed (readable) cookie would leak it to the browser.
                strategy: "jwe",
                // Refreshes the cookie before expiry without needing a database.
                refreshCache: true,
            },
        },
        plugins: [
            restCredentials({
                restClient: options.restClient,
                ...options.restCredentials,
            }),
            expo(),
            ...(options.extraPlugins ?? []),
        ],
        trustedOrigins: options.trustedOrigins ?? ["te-inscreve://"],
        onAPIError: {
            onError(error: unknown) {
                console.error("[auth] API error", error);
            },
        },
    });
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];

export {
    restAuthResponseSchema,
    restCredentials,
    type RestAuthResponse,
    type RestCredentialsOptions,
    type RestCredentialsPlugin,
} from "./rest-credentials";
