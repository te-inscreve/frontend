import "server-only";

import { cookies } from "next/headers";

import { HttpClient } from "@te-inscreve/rest";

import { env } from "~/shared/env";

/**
 * Anonymous client for the backend REST API.
 *
 * Procedures never use this directly — the tRPC context calls `.withToken()` on
 * it to bind the signed-in user's JWT. It's also what the auth plugin uses for
 * the login/register calls themselves.
 *
 * The CSRF token is injected here, at the composition root, rather than inside
 * the client: `cookies()` only exists in the Next.js server runtime, and
 * importing it into `@te-inscreve/rest` would make that package unusable from
 * React Native and from tests.
 */
export const restClient = new HttpClient({
    baseUrl: env.API_URL,
    getCsrfToken: async () => (await cookies()).get("csrftoken")?.value ?? null,
    timeout: 15_000, // 15s
});
