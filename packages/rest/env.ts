import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const restEnv = () =>
    createEnv({
        server: {
            /** Base URL of the "te inscreve" backend REST API. */
            API_URL: z.url(),
        },
        runtimeEnv: process.env,
        emptyStringAsUndefined: true,
        skipValidation:
            !!process.env.CI || process.env.npm_lifecycle_event === "lint",
    });
