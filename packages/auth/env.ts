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
        },
        runtimeEnv: process.env,
        emptyStringAsUndefined: true,
        skipValidation:
            (!!process.env.CI && !process.env.VERCEL) ||
            process.env.npm_lifecycle_event === "lint",
    });
