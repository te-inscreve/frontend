import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { Categoria } from "@te-inscreve/schemas";
import { formCategoriaSchema } from "@te-inscreve/schemas";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const categoriaRouter = {
    /**
     * Categorias de uma modalidade.
     *
     * O backend valida a cadeia inteira do caminho: uma modalidade que não
     * pertence ao evento responde 404 em vez de devolver as categorias dela.
     */
    getAll: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<Categoria[]>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias`,
                {
                    next: {
                        revalidate: 30,
                        tags: [
                            "categorias",
                            `modalidade-${input.modalidadeId}-categorias`,
                        ],
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Cria uma categoria numa modalidade que já existe.
     *
     * Os dois ids ficam fora do corpo porque o recurso é aninhado: eles são o
     * caminho, e o backend valida a cadeia inteira antes de gravar.
     */
    create: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoria: formCategoriaSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Categoria>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias`,
                input.categoria,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
