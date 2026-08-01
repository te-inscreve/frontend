import Constants from "expo-constants";

/**
 * Where the Next.js BFF lives — it hosts both `/api/trpc` and `/api/auth`.
 *
 * In development this resolves to your host machine's LAN IP so a physical
 * device can reach it. Point it at your deployed web app for production.
 */
export const getBaseUrl = () => {
    /**
     * Gets the IP address of your host-machine. If it cannot automatically find
     * it, you'll have to manually set it. NOTE: Port 3000 should work for most
     * but confirm you don't have anything else running on it.
     */
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];

    if (!localhost) {
        // return "https://app.teinscreve.com";
        throw new Error(
            "Failed to get localhost. Please point to your production server.",
        );
    }
    return `http://${localhost}:3000`;
};
