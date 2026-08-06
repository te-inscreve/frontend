import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/shared/utils/env");

/** @type {import("next").NextConfig} */
const config = {
    /** Enables hot reloading for local packages without a build step */
    transpilePackages: [
        "@te-inscreve/api",
        "@te-inscreve/auth",
        "@te-inscreve/rest",
        "@te-inscreve/components",
        "@te-inscreve/schemas",
    ],

    /** We already do linting and typechecking as separate tasks in CI */
    // typescript: { ignoreBuildErrors: true },
    allowedDevOrigins: ["172.18.100.153"],
    experimental: {
        optimizePackageImports: ["@phosphor-icons/react"],
    },
};

export default config;
