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

    webpack: (webpackConfig) => {
        webpackConfig.module.rules.unshift({
            test: /\.svg$/i,
            type: "asset/source",
        });

        return webpackConfig;
    },

    /** We already do linting and typechecking as separate tasks in CI */
    // typescript: { ignoreBuildErrors: true },
    allowedDevOrigins: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
    images: {
        dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
        remotePatterns: process.env.IMAGE_PROVIDERS?.split(",").filter(pattern => !!pattern)?.map((pattern) => {
            const url = new URL(pattern);
            return {
                protocol: url.protocol.includes("https") ? "https" : "http",
                hostname: url.hostname,
                port: url.port,
                pathname: '/**',
            };
        }) ?? [],
    },
    experimental: {
        optimizePackageImports: ["@phosphor-icons/react"],
    },
    turbopack: {
        rules: {
            "*.svg": {
                loaders: ["raw-loader"],
                as: "*.js",
            },
        },
    },
};

export default config;
