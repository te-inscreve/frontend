import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type {
    Integrante,
    IntegranteDetalhe,
    PaginaIntegrantes,
} from "@te-inscreve/schemas";
import { formIntegranteSchema } from "@te-inscreve/schemas";

import { authenticatedProcedure } from "../trpc";

/**
 * Os integrantes da entidade de quem está logado.
 *
 * Nenhuma leitura daqui entra no Data Cache do Next, pelo mesmo motivo de
 * `entidade.minha`: o recurso é por usuário, e a tag para derrubá-lo seria a
 * mesma para todas as sessões. Quem muda um integrante invalida as queries no
 * cliente, que é onde elas vivem.
 */
export const integranteRouter = {
    /**
     * Uma página da listagem.
     *
     * O campo chama `cursor`, e não `page`, porque é o nome que o
     * `infiniteQueryOptions` do tRPC exige para alimentar a query infinita —
     * para o backend ele vira o `page` da URL. `null` é a primeira página.
     */
    list: authenticatedProcedure
        .input(
            z.object({
                cursor: z.number().int().positive().nullish(),
                pageSize: z.number().int().positive().max(100).default(20),
            }),
        )
        .query(async ({ ctx, input }) => {
            const params = new URLSearchParams({
                page: String(input.cursor ?? 1),
                pageSize: String(input.pageSize),
            });
            const result = await ctx.restClient.get<PaginaIntegrantes>(
                `/minha-entidade/integrantes?${params}`,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * O detalhe de um integrante — a única leitura que traz `grupos`.
     *
     * Um id que não é da entidade responde 404, e isso é página inexistente,
     * não erro: quem chama decide o que mostrar.
     */
    getById: authenticatedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<IntegranteDetalhe>(
                `/minha-entidade/integrantes/${input.id}`,
            );
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }
            return result.data;
        }),

    create: authenticatedProcedure
        .input(formIntegranteSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Integrante>(
                `/minha-entidade/integrantes`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * `PUT`, ao contrário dos outros recursos: o backend não aceita `PATCH`
     * aqui ("Método PATCH não é permitido"). Por isso o corpo é o cadastro
     * inteiro, e não um parcial — o formulário sempre manda todos os campos.
     *
     * Menos `grupos`: o formulário não o envia, para a edição do cadastro não
     * zerar a formação. Quem muda de que grupos a pessoa faz parte é a rota
     * `grupo` (`salvarFormacao` e `removerIntegrante`).
     */
    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number().int().positive(),
                integrante: formIntegranteSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.put<Integrante>(
                `/minha-entidade/integrantes/${input.id}`,
                input.integrante,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
