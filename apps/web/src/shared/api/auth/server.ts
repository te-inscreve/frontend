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
 * The `refresh` token that rides along is intentionally dropped: the session
 * cookie carries the access token only, so the session ends when it expires.
 */
const djangoAuthResponseSchema = z.object({
    access: z.string().min(1),
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
        allowedHosts: ["localhost:*", ...(env.ALLOWED_ORIGINS as string[])],
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
            const { access, user } = djangoAuthResponseSchema.parse(raw);

            return {
                token: access,
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
