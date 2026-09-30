import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { InscricoesCriadas } from "@te-inscreve/schemas";
import { criarInscricaoSchema } from "@te-inscreve/schemas";

import { authenticatedProcedure } from "../trpc";

export const inscricaoRouter = {
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
