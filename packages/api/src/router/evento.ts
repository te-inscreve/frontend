import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import type { Evento, EventoPreview } from "@te-inscreve/schemas";

import { authenticatedProcedure, publicProcedure } from "../trpc";

/**
 * Reference router — the pattern every domain router should follow.
 *
 * Types come from `@te-inscreve/schemas`, the single source of truth for
 * shapes crossing the REST boundary.
 */
export const eventoRouter = {
    getAll: publicProcedure
        .input(
            z
                .object({
                    search: z.string().optional(),
                })
                .optional(),
        )
        .query(async ({ ctx }) => {
            const result = await ctx.restClient.get<EventoPreview[]>(
                `/eventos`,
                {
                    next: { revalidate: 30, tags: ["eventos"] },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    getById: publicProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<Evento>(
                `/eventos/${input.id}`,
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

    create: authenticatedProcedure
        .input(z.instanceof(FormData))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Evento>(`/eventos`, input);
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Edição do evento. Só os campos presentes no `FormData` são enviados, o
     * que deixa o organizador salvar sem reenviar logo, cartaz e regulamento
     * que não trocou — daí o PATCH em vez de PUT.
     *
     * O id viaja dentro do próprio `FormData`, e não ao lado dele: o link que
     * transporta multipart não serializa o input, então a mutação inteira
     * precisa caber em um `FormData`.
     */
    update: authenticatedProcedure
        .input(z.instanceof(FormData))
        .mutation(async ({ ctx, input }) => {
            const id = Number(input.get("id"));

            if (!Number.isInteger(id) || id <= 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "O id do evento a editar está ausente ou inválido.",
                });
            }

            input.delete("id");

            const result = await ctx.restClient.patch<Evento>(
                `/eventos/${id}`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    delete: authenticatedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.delete(`/eventos/${input.id}`);
            if (!result.ok) throw result.error;
            return { id: input.id };
        }),
} satisfies TRPCRouterRecord;
