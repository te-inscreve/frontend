import { defineConfig } from "eslint/config";

import { baseConfig } from "@te-inscreve/eslint-config/base";

export default defineConfig({ ignores: ["dist/**"] }, baseConfig);
