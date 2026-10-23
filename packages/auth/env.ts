import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const authEnv = () =>
    createEnv({
        server: {
            /**
             * Signs & encrypts the better-auth session cookie. Because auth runs in
             * stateless mode, this cookie IS the session store — losing or rotating
             * this secret logs everybody out.
             */
            AUTH_SECRET:
                process.env.NODE_ENV === "production"
                    ? z.string().min(32)
                    : z.string().min(1).optional(),
            /**
             * Fixes the protocol better-auth assumes, and with it whether the
             * session cookie is `Secure`. Unset, a production build always uses
             * `Secure` cookies, which the browser drops over plain HTTP on any
             * host but `localhost`. `http` lets `yarn start` work on the LAN IP.
             */
            AUTH_PROTOCOL: z.enum(["http", "https"]).optional(),
        },
        runtimeEnv: process.env,
        emptyStringAsUndefined: true,
        skipValidation:
            (!!process.env.CI && !process.env.VERCEL) ||
            process.env.npm_lifecycle_event === "lint",
    });
