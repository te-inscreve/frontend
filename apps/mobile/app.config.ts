import type { ConfigContext, ExpoConfig } from "expo/config";

// Development is the default so a dev build never lands on top of the release
// installed on the same device: each variant has its own package, name and
// scheme. Only `APP_VARIANT=production` builds the real app.
const isProduction = process.env.APP_VARIANT === "production";
const appId = isProduction
    ? "br.com.teinscreve.app"
    : "br.com.teinscreve.app.dev";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: isProduction ? "te inscreve" : "te inscreve (dev)",
    slug: "te-inscreve",
    // Must match a scheme listed in `trustedOrigins` on the auth server.
    scheme: isProduction ? "te-inscreve" : "te-inscreve-dev",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    updates: {
        fallbackToCacheTimeout: 0,
    },
    // The new architecture is the only option since SDK 57 — no flag needed.
    assetBundlePatterns: ["**/*"],
    ios: {
        bundleIdentifier: appId,
        supportsTablet: true,
    },
    // Edge-to-edge is always on since SDK 57, so there is no flag to set here.
    android: {
        package: appId,
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#4B8B3B",
        },
    },
    web: {
        favicon: "./assets/favicon.png",
    },
    experiments: {
        tsconfigPaths: true,
        typedRoutes: true,
    },
    plugins: [
        "expo-router",
        "expo-secure-store",
        "expo-splash-screen",
        "expo-sqlite",
        "expo-status-bar",
        "expo-web-browser",
        [
            "expo-build-properties",
            {
                // Debug builds already allow plain HTTP; a release pointed at
                // the BFF on the LAN (`EXPO_PUBLIC_BFF_URL=http://…`) needs it too.
                android: {
                    usesCleartextTraffic:
                        process.env.EXPO_PUBLIC_BFF_URL?.startsWith(
                            "http://",
                        ) ?? false,
                },
            },
        ],
    ],
});
