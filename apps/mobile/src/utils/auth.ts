import type { BetterAuthClientPlugin } from "better-auth";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

import { restCredentialsClient } from "@te-inscreve/auth/client";

import { getBaseUrl } from "./base-url";

type ExpoPlugin = ReturnType<typeof expoClient>;

// The dev and production variants use different schemes (see `app.config.ts`).
const { scheme } = Constants.expoConfig ?? {};

/**
 * `@better-auth/expo@1.6.25` declares `getActions` with a narrower `BetterFetch`
 * parameter than `BetterAuthClientPlugin` requires, so TypeScript rejects an
 * otherwise-valid plugin (reproducible with the plugin on its own — it is not
 * caused by anything in this repo).
 *
 * Only the offending parameter list is replaced: the rest of the plugin keeps
 * its concrete type, which is what better-auth needs to infer the client API.
 * Widening it to plain `BetterAuthClientPlugin` would erase that inference and
 * take `signIn`/`signOut` down with it. Drop this once upstream widens it.
 */
const expoAuthPlugin = expoClient({
    scheme: (Array.isArray(scheme) ? scheme[0] : scheme) ?? "te-inscreve",
    storagePrefix: "te-inscreve",
    storage: SecureStore,
}) as unknown as Omit<ExpoPlugin, "getActions"> & {
    getActions: (
        ...args: Parameters<NonNullable<BetterAuthClientPlugin["getActions"]>>
    ) => ReturnType<ExpoPlugin["getActions"]>;
};

/**
 * Talks to the same better-auth server the web app uses.
 *
 * The `expo` plugin persists the session cookie in SecureStore and replays it
 * on every request, so `authClient.getCookie()` is what the tRPC link uses to
 * authenticate outgoing calls.
 */
export const authClient = createAuthClient({
    baseURL: getBaseUrl(),
    plugins: [expoAuthPlugin, restCredentialsClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
