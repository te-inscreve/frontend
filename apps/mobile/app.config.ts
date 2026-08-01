import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "te inscreve",
    slug: "te-inscreve",
    // Must match the scheme listed in `trustedOrigins` on the auth server.
    scheme: "te-inscreve",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    updates: {
        fallbackToCacheTimeout: 0,
    },
    // The new architecture is the only option in SDK 57 — no flag needed.
    assetBundlePatterns: ["**/*"],
    ios: {
        bundleIdentifier: "br.com.teinscreve.app",
        supportsTablet: true,
    },
    // Edge-to-edge is always on in SDK 57, so there is no flag to set here.
    android: {
        package: "br.com.teinscreve.app",
    },
    experiments: {
        tsconfigPaths: true,
        typedRoutes: true,
    },
    plugins: ["expo-router", "expo-secure-store", "expo-web-browser"],
});
