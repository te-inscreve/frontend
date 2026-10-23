import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";
import { z } from "zod/v4";

import { initAuth } from "@te-inscreve/auth";

import { httpClient } from "~/shared/api/http-client";
import { env } from "~/shared/utils/env";

/**
 * What `dj-rest-auth` answers on `/auth/login/` and `/auth/registration/` when
 * `REST_AUTH.USE_JWT` is on: its `JWTSerializer` names the JWT `access`, and
 * the nested user comes from `UserDetailsSerializer`, which exposes the primary
 * key as `pk` — neither matches the `{ token, user: { id } }` shape
 * `@te-inscreve/auth` expects.
 *
 * The `refresh` token is mapped separately so the auth plugin can keep it in an
 * encrypted, HTTP-only cookie and rotate the access token before it expires.
 */
const djangoAuthResponseSchema = z.object({
    access: z.string().min(1),
    refresh: z.string().min(1),
    user: z.object({
        pk: z.number(),
        username: z.string(),
        email: z.string(),
        firstName: z.string().nullish(),
        lastName: z.string().nullish(),
    }),
});

export const auth = initAuth({
    baseUrl: {
        // `127.0.0.1` é o mesmo loopback do `localhost`, e é por ele que o app
        // mobile chega aqui com `expo start --localhost` + `adb reverse`.
        allowedHosts: ["localhost:*", "127.0.0.1:*", ...env.ALLOWED_ORIGINS],
        protocol: env.AUTH_PROTOCOL,
    },
    secret: env.AUTH_SECRET,
    restClient: httpClient,
    // Lets the Expo app call this auth server over its custom scheme.
    trustedOrigins: ["te-inscreve://"],
    extraPlugins: [nextCookies()],
    restCredentials: {
        // Translates the Django payload at the boundary, so the rest of the
        // monorepo only ever sees better-auth's session/user shape.
        parseAuthResponse: (raw) => {
            const { access, refresh, user } =
                djangoAuthResponseSchema.parse(raw);

            return {
                token: access,
                refreshToken: refresh,
                user: {
                    id: String(user.pk),
                    email: user.email,
                    // The API has no single `name` column; `username` is the
                    // fallback for accounts that never filled the name in.
                    name:
                        [user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ") || user.username,
                },
            };
        },
    },
});

export const getSession = cache(async () =>
    auth.api.getSession({ headers: await headers() }),
);
