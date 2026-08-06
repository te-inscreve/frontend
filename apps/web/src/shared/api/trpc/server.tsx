import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@te-inscreve/api";
import { appRouter, createTRPCServerContext } from "@te-inscreve/api";

import { auth } from "~/shared/api/auth/server";
import { httpClient } from "~/shared/api/http-client";
import { createQueryClient } from "./query-client";

/**
 * Wraps `createTRPCContext` for calls coming from a React Server Component.
 */
const createContext = cache(async () => {
    const heads = new Headers(await headers());
    heads.set("x-trpc-source", "rsc");

    return createTRPCServerContext({
        headers: heads,
        auth,
        restClient: httpClient,
    });
});

const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
    router: appRouter,
    ctx: createContext,
    queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
    const queryClient = getQueryClient();
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {props.children}
        </HydrationBoundary>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
    queryOptions: T,
) {
    const queryClient = getQueryClient();
    if (queryOptions.queryKey[1]?.type === "infinite") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
        void queryClient.prefetchQuery(queryOptions);
    }
}
