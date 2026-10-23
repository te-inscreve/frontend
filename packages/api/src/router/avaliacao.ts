import type { TRPCRouterRecord } from "@trpc/server";

import { categoriasDisponiveisSchema } from "@te-inscreve/schemas";

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
} satisfies TRPCRouterRecord;
