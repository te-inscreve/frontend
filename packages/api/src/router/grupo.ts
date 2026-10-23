import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { Grupo, GrupoDetalhe, PaginaGrupos } from "@te-inscreve/schemas";
import { formacaoGrupoSchema, formGrupoSchema } from "@te-inscreve/schemas";

import { authenticatedProcedure } from "../trpc";

const idSchema = z.number().int().positive();

/**
 * Os grupos da entidade de quem está logado.
 *
 * Nenhuma leitura daqui entra no Data Cache do Next, pelo mesmo motivo de
 * `integrante`: o recurso é por usuário, e a tag para derrubá-lo seria a
 * mesma para todas as sessões. Quem muda um grupo invalida as queries no
 * cliente, que é onde elas vivem.
 *
 * Nome repetido dentro da entidade volta como `{"nome": ["..."]}` — o
 * `errorFormatter` o entrega ao cliente em `error.data.fieldErrors`.
 */
export const grupoRouter = {
    /**
     * Uma página da listagem, sem a formação.
     *
     * `cursor`, e não `page`: é o nome que o `infiniteQueryOptions` exige —
     * para o backend ele vira o `page` da URL. `null` é a primeira página.
     */
    list: authenticatedProcedure
        .input(
            z.object({
                cursor: idSchema.nullish(),
                pageSize: z.number().int().positive().max(100).default(12),
            }),
        )
        .query(async ({ ctx, input }) => {
            const params = new URLSearchParams({
                page: String(input.cursor ?? 1),
                pageSize: String(input.pageSize),
            });
            const result = await ctx.restClient.get<PaginaGrupos>(
                `/minha-entidade/grupos?${params}`,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * O detalhe de um grupo — a única leitura que traz `integrantes`.
     *
     * Um id que não é da entidade responde 404, e isso é grupo inexistente,
     * não erro: quem chama decide o que mostrar.
     */
    getById: authenticatedProcedure
        .input(z.object({ id: idSchema }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<GrupoDetalhe>(
                `/minha-entidade/grupos/${input.id}`,
            );
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }
            return result.data;
        }),

    create: authenticatedProcedure
        .input(formGrupoSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Grupo>(
                `/minha-entidade/grupos`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /** Nome e descrição. `PATCH` parcial: a formação fica como está. */
    update: authenticatedProcedure
        .input(z.object({ id: idSchema, grupo: formGrupoSchema }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.patch<GrupoDetalhe>(
                `/minha-entidade/grupos/${input.id}`,
                input.grupo,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * A formação inteira, pelos ids. É o mesmo `PATCH` do `update`, com outro
     * corpo — separado porque a tela salva as duas coisas em momentos
     * diferentes: o diálogo do menu salva o texto, o botão da bancada salva
     * quem está no grupo.
     */
    salvarFormacao: authenticatedProcedure
        .input(formacaoGrupoSchema.extend({ id: idSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...formacao } = input;
            const result = await ctx.restClient.patch<GrupoDetalhe>(
                `/minha-entidade/grupos/${id}`,
                formacao,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    remove: authenticatedProcedure
        .input(z.object({ id: idSchema }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.delete(
                `/minha-entidade/grupos/${input.id}`,
            );
            if (!result.ok) throw result.error;
        }),

    /**
     * Desfaz um vínculo só. É o que o detalhe do integrante usa: de lá se vê
     * a pessoa e os grupos dela, e tirar de um não deveria exigir reenviar a
     * formação inteira do grupo.
     */
    removerIntegrante: authenticatedProcedure
        .input(z.object({ grupoId: idSchema, integranteId: idSchema }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.delete(
                `/minha-entidade/grupos/${input.grupoId}/integrantes/${input.integranteId}`,
            );
            if (!result.ok) throw result.error;
        }),
} satisfies TRPCRouterRecord;
