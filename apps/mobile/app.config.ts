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
    icon: "./assets/icon.png",
    updates: {
        fallbackToCacheTimeout: 0,
    },
    // The new architecture is the only option since SDK 57 — no flag needed.
    assetBundlePatterns: ["**/*"],
    ios: {
        bundleIdentifier: "br.com.teinscreve.app",
        supportsTablet: true,
    },
    // Edge-to-edge is always on since SDK 57, so there is no flag to set here.
    android: {
        package: "br.com.teinscreve.app",
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
