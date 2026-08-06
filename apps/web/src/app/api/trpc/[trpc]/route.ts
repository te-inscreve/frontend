import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCServerContext } from "@te-inscreve/api";

import { auth } from "~/shared/api/auth/server";
import { httpClient } from "~/shared/api/http-client";

/**
 * CORS for the Expo app, which calls this endpoint cross-origin.
 *
 * `Access-Control-Allow-Origin: *` cannot be combined with credentials, so
 * tighten this to your real app origins before going to production.
 */
const setCorsHeaders = (res: Response) => {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Request-Method", "*");
    res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
    res.headers.set("Access-Control-Allow-Headers", "*");
};

const OPTIONS = () => {
    const response = new Response(null, { status: 204 });
    setCorsHeaders(response);
    return response;
};

const handler = async (req: NextRequest) => {
    const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        router: appRouter,
        req,
        createContext: () =>
            createTRPCServerContext({
                auth,
                restClient: httpClient,
                headers: req.headers,
            }),
        onError({ error, path }) {
            console.error(`>>> tRPC Error on '${path}'`, error);
        },
    });

    setCorsHeaders(response);
    return response;
};

export { handler as GET, OPTIONS, handler as POST };
