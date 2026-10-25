import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

import { authEnv } from "@te-inscreve/auth/env";
import { restEnv } from "@te-inscreve/rest/env";

export const env = createEnv({
    extends: [authEnv(), restEnv(), vercel()],
    shared: {
        NODE_ENV: z
            .enum(["development", "production", "test"])
            .default("development"),
    },
    /**
     * Server-side only. `API_URL` comes from `@te-inscreve/rest/env` — the
     * backend is never called straight from the browser, always through tRPC.
     */
    server: {
        /**
         * Endereço público do site, base das URLs absolutas que as prévias de
         * link (Open Graph) exigem. Sem ele, cai no domínio de produção da
         * Vercel e, fora dela, em `http://localhost:3000`.
         */
        SITE_URL: z.url().optional(),
        ALLOWED_ORIGINS: z
            .string()
            .optional()
            .transform((val) => val?.split(",") ?? []),
    },
    /**
     * Client-side variables. Prefix them with `NEXT_PUBLIC_` to expose them.
     */
    client: {},
    /**
     * Destructure all variables from `process.env` to make sure they aren't
     * tree-shaken away.
     */
    experimental__runtimeEnv: {
        NODE_ENV: process.env.NODE_ENV,
    },
    skipValidation:
        (!!process.env.CI && !process.env.VERCEL) ||
        process.env.npm_lifecycle_event === "lint",
});
