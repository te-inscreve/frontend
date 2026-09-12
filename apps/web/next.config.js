import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/shared/utils/env");

// O portão do `next/image`, pelo mesmo carregador. O `jiti.import` devolve
// `unknown`, e é o cast que traz de volta os tipos do módulo.
const { provedoresDeImagem, ehHostLocal } =
    /** @type {typeof import("./imagens.config")} */ (
        await jiti.import("./imagens.config")
    );

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
        /**
         * Abre o portão a partir do que está em `IMAGE_PROVIDERS`, e não do
         * `NODE_ENV`: rodar o build localmente (`yarn start`) mantém
         * `NODE_ENV=production`, mas as imagens continuam vindo do mesmo
         * backend local do `next dev` — com o portão fechado elas voltam 400
         * (`"url" parameter is not allowed`). Um deploy de verdade, que aponta
         * para um host público, mantém o portão fechado sem depender de
         * ninguém lembrar de configurar nada.
         */
        dangerouslyAllowLocalIP: provedoresDeImagem.some((url) =>
            ehHostLocal(url.hostname),
        ),
        remotePatterns: provedoresDeImagem.map((url) => ({
            protocol: url.protocol.includes("https") ? "https" : "http",
            hostname: url.hostname,
            port: url.port,
            pathname: "/**",
        })),
    },
    experimental: {
        optimizePackageImports: ["@phosphor-icons/react"],
        /** Libera `forbidden()` e o arquivo `forbidden.tsx` de rota. */
        authInterrupts: true,
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
