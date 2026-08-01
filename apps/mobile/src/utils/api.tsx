import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@te-inscreve/api";

import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient();

/**
 * A set of typesafe hooks for consuming the API.
 *
 * `@te-inscreve/api` is a *dev* dependency here: the mobile bundle only ever
 * pulls in its types, never its server code.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
    client: createTRPCClient<AppRouter>({
        links: [
            loggerLink({
                enabled: (opts) =>
                    process.env.NODE_ENV === "development" ||
                    (opts.direction === "down" && opts.result instanceof Error),
                colorMode: "ansi",
            }),
            httpBatchLink({
                transformer: superjson,
                url: `${getBaseUrl()}/api/trpc`,
                headers() {
                    const headers = new Map<string, string>();
                    headers.set("x-trpc-source", "expo-react");

                    const cookies = authClient.getCookie();
                    if (cookies) {
                        headers.set("Cookie", cookies);
                    }
                    return Object.fromEntries(headers);
                },
            }),
        ],
    }),
    queryClient,
});

export type { RouterInputs, RouterOutputs } from "@te-inscreve/api";
