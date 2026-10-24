import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const restEnv = () =>
    createEnv({
        server: {
            /** Base URL of the "te inscreve" backend REST API. */
            API_URL: z.url(),
            /**
             * Key sent as `X-API-KEY` on every request. Optional: unset, the
             * header is left out, for backends that don't require it.
             */
            API_KEY: z.string().min(1).optional(),
        },
        runtimeEnv: process.env,
        emptyStringAsUndefined: true,
        skipValidation:
            (!!process.env.CI && !process.env.VERCEL) ||
            process.env.npm_lifecycle_event === "lint",
    });
