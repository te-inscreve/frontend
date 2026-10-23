import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const restEnv = () =>
    createEnv({
        server: {
            /** Base URL of the "te inscreve" backend REST API. */
            API_URL: z.url(),
            /** Key the backend REST API expects on the `key` query param. */
            API_KEY: z.string().min(1),
        },
        runtimeEnv: process.env,
        emptyStringAsUndefined: true,
        skipValidation:
            (!!process.env.CI && !process.env.VERCEL) ||
            process.env.npm_lifecycle_event === "lint",
    });
