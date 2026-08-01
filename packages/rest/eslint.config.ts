import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@te-inscreve/eslint-config/base";

export default defineConfig(
    { ignores: ["dist/**"] },
    baseConfig,
    restrictEnvAccess,
);
