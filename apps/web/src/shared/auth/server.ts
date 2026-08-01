import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@te-inscreve/auth";

import { env } from "~/shared/env";
import { restClient } from "~/shared/rest";

const baseUrl =
    env.VERCEL_ENV === "production"
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
        : env.VERCEL_ENV === "preview"
          ? `https://${env.VERCEL_URL}`
          : // PORT is injected by the dev server, so it isn't part of the validated
            // env schema.
            // eslint-disable-next-line no-restricted-properties
            `http://localhost:${process.env.PORT ?? 3000}`;

export const auth = initAuth({
    baseUrl,
    secret: env.AUTH_SECRET,
    restClient,
    // Lets the Expo app call this auth server over its custom scheme.
    trustedOrigins: ["te-inscreve://"],
    extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
    auth.api.getSession({ headers: await headers() }),
);
