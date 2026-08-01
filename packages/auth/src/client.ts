import type { BetterAuthClientPlugin } from "better-auth";

import type { RestCredentialsPlugin } from "./rest-credentials";

/**
 * Client-side counterpart of the `restCredentials` server plugin.
 *
 * It carries no runtime behaviour — it exists so the auth client infers the
 * extra endpoints, giving you typed:
 *
 * ```ts
 * await authClient.signIn.rest({ email, password });
 * await authClient.signUp.rest({ name, email, password });
 * ```
 */
export const restCredentialsClient = () => {
    return {
        id: "rest-credentials",
        $InferServerPlugin: {} as RestCredentialsPlugin,
    } satisfies BetterAuthClientPlugin;
};
