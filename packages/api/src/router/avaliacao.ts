import type { TRPCRouterRecord } from "@trpc/server";

import {
    categoriasDisponiveisSchema,
    minhasAvaliacoesSchema,
} from "@te-inscreve/schemas";

import { authenticatedProcedure } from "../trpc";

export const avaliacaoRouter = {
    /**
     * As categorias `pronta_avaliacao`, na árvore evento → modalidade →
     * categoria. Qualquer usuário autenticado vê todas: a visibilidade é do
     * backend, e não há vínculo avaliador ↔ categoria por trás do filtro.
     *
     * Sem cache: liberar uma categoria para avaliação tem de aparecer no
     * próximo pull-to-refresh do avaliador.
     */
    getCategoriasDisponiveis: authenticatedProcedure.query(async ({ ctx }) => {
        const result = await ctx.restClient.get<unknown>(
            "/avaliacoes/categorias-disponiveis/",
        );
        if (!result.ok) throw result.error;
        return categoriasDisponiveisSchema.parse(result.data);
    }),

    /**
     * As avaliações que o usuário logado enviou e o servidor aceitou, na
     * árvore evento → modalidade → categoria. O escopo é do backend: sempre
     * as do próprio usuário.
     *
     * Sem cache: uma avaliação que acabou de sincronizar tem de aparecer no
     * próximo pull-to-refresh.
     */
    getMinhasAvaliacoes: authenticatedProcedure.query(async ({ ctx }) => {
        const result = await ctx.restClient.get<unknown>("/minhas-avaliacoes/");
        if (!result.ok) throw result.error;
        return minhasAvaliacoesSchema.parse(result.data);
    }),
} satisfies TRPCRouterRecord;
