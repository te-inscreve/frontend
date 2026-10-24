import "server-only";

import { cookies } from "next/headers";

import { HttpClient } from "@te-inscreve/rest";

import { env } from "~/shared/utils/env";

/**
 * Anonymous client for the backend REST API.
 *
 * Procedures never use this directly — the tRPC context calls `.withToken()` on
 * it to bind the signed-in user's JWT. It's also what the auth plugin uses for
 * the login/register calls themselves.

 */
export const httpClient = new HttpClient({
    baseUrl: env.API_URL,
    getCsrfToken: async () => (await cookies()).get("csrftoken")?.value ?? null,
    timeout: 15_000, // 15s
    fetch: fetch,
    defaultHeaders: env.API_KEY ? { "X-API-KEY": env.API_KEY } : {},
});
