import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@te-inscreve/eslint-config/base";
import { nextjsConfig } from "@te-inscreve/eslint-config/nextjs";
import { reactConfig } from "@te-inscreve/eslint-config/react";

export default defineConfig(
    { ignores: [".next/**"] },
    baseConfig,
    reactConfig,
    nextjsConfig,
    restrictEnvAccess,
);
