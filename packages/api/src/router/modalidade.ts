import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { Modalidade } from "@te-inscreve/schemas";
import { createModalidadeSchema } from "@te-inscreve/schemas";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const modalidadeRouter = {
    /**
     * Modalidades de um evento.
     *
     * O recurso é aninhado no backend, então o id do evento faz parte do
     * caminho — e um evento inexistente responde 404, que o middleware
     * converte em `NOT_FOUND`.
     */
    getAll: publicProcedure
        .input(z.object({ eventoId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<Modalidade[]>(
                `/eventos/${input.eventoId}/modalidades`,
                {
                    next: {
                        revalidate: 30, // 30 segundos
                        tags: [
                            "modalidades",
                            `evento-${input.eventoId}-modalidades`,
                        ],
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
    /**
     * Cria a modalidade com as categorias dela na mesma requisição — o
     * backend aceita o aninhamento, então o organizador não precisa salvar a
     * modalidade antes de cadastrar as categorias.
     */
    create: authenticatedProcedure
        .input(createModalidadeSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Modalidade>(
                `/eventos/${input.evento}/modalidades`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
