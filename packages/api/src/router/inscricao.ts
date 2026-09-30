import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type {
    InscricoesCriadas,
    InscricoesDaCategoria,
} from "@te-inscreve/schemas";
import { criarInscricaoSchema } from "@te-inscreve/schemas";

import { tagsInscricoes } from "../cache-tags";
import { authenticatedProcedure, publicProcedure } from "../trpc";

export const inscricaoRouter = {
    /**
     * Inscrições de uma categoria, de todas as entidades.
     *
     * O formato segue a modalidade: na individual cada item traz o
     * `concorrente`; na em grupo, só `totalIntegrantes` (e `nomeConcorrente`,
     * quando a modalidade o exibe).
     */
    getAll: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<InscricoesDaCategoria>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/inscricoes/`,
                {
                    next: {
                        revalidate: 30,
                        tags: tagsInscricoes(input.categoriaId),
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Inscreve a entidade de quem está logado numa categoria.
     *
     * A entidade não vai no corpo: o backend a tira do usuário da sessão. Os
     * três ids são o caminho, e ele valida a cadeia inteira antes de gravar.
     *
     * Devolve uma lista mesmo na modalidade em grupo: na individual, cada
     * pessoa enviada vira uma inscrição, num lote que entra inteiro ou não
     * entra. As recusas de domínio — faixa etária, janela fechada, limite,
     * pessoa já inscrita — chegam como `fieldErrors.detail`.
     */
    create: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
                inscricao: criarInscricaoSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<InscricoesCriadas>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/inscricoes/`,
                input.inscricao,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
