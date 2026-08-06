import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { Evento } from "@te-inscreve/schemas";
import { restEnv } from "@te-inscreve/rest/env";
import { createEventoSchema } from "@te-inscreve/schemas";

import { protectedProcedure, publicProcedure } from "../trpc";

/** Read lazily: at import time the env may not be populated yet. */
const apiKey = () => restEnv().API_KEY;

/**
 * Reference router — the pattern every domain router should follow.
 *
 * 1. `ctx.rest` already carries the signed-in user's JWT.
 * 2. Nothing throws: every call resolves with a `Result`, and the compiler
 *    refuses to let you touch `.data` before narrowing on `.ok`. Re-throw
 *    `result.error` to hand it to the middleware in `trpc.ts`, which classifies
 *    any `HttpError` into the matching tRPC code — or handle the status inline
 *    when it is a meaningful outcome rather than a failure, as `byId` does.
 * 3. `next: { revalidate, tags }` is forwarded to Next's fetch cache; call
 *    `revalidateTag("eventos")` to bust it.
 *
 * Types come from `@te-inscreve/schemas`, the single source of truth for
 * shapes crossing the REST boundary.
 */
export const eventoRouter = {
    all: publicProcedure.query(async ({ ctx }) => {
        const result = await ctx.rest.get<Evento[]>(
            `/eventos.json?key=${apiKey()}`,
            {
                next: { revalidate: 30, tags: ["eventos"] },
            },
        );
        if (!result.ok) throw result.error;
        return result.data;
    }),

    byId: publicProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.rest.get<Evento>(
                `/eventos/${input.id}?key=${apiKey()}`,
                {
                    next: {
                        revalidate: 30,
                        tags: ["eventos", `evento-${input.id}`],
                    },
                },
            );

            // if id dont exist, return null instead of throwing
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }

            return result.data;
        }),

    create: protectedProcedure
        .input(createEventoSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.rest.post<Evento>(
                `/eventos?key=${apiKey()}`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
