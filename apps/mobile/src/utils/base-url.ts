import Constants from "expo-constants";

/**
 * Where the Next.js BFF lives — it hosts both `/api/trpc` and `/api/auth`.
 *
 * In development it is the host Metro announces — your machine's LAN IP — on
 * port 3000, so it follows the machine across networks. A release build has no
 * Metro to ask and uses `EXPO_PUBLIC_BFF_URL`, inlined into the bundle at
 * build time.
 */
export const getBaseUrl = () => {
    const localhost = Constants.expoConfig?.hostUri?.split(":")[0];
    if (localhost) return `http://${localhost}:3000`;

    const bffUrl = process.env.EXPO_PUBLIC_BFF_URL;
    if (!bffUrl) {
        throw new Error(
            "No BFF URL: set EXPO_PUBLIC_BFF_URL in apps/mobile/.env before building a release.",
        );
    }
    return bffUrl.replace(/\/$/, "");
};

/**
 * Makes a URL from the API reachable from the device.
 *
 * Against a local API, media URLs come back built from the host the BFF called
 * it on — `localhost` — which, on a physical device, is the device itself.
 * Swaps that host for the BFF's, the machine the device already reaches.
 * Production URLs pass through untouched.
 */
export const urlDoAparelho = (url: string) => {
    const host = getBaseUrl().split("://")[1]?.split(/[:/]/)[0];
    if (!host) return url;

    return url.replace(
        /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/,
        `$1${host}`,
    );
};
