import { defineConfig } from "eslint/config";

import { baseConfig } from "@te-inscreve/eslint-config/base";
import { reactConfig } from "@te-inscreve/eslint-config/react";

export default defineConfig({ ignores: ["dist/**"] }, baseConfig, reactConfig);
