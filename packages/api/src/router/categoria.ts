import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type {
    AvaliadoresDaCategoria,
    Categoria,
    CategoriaDetalhe,
    ModeloFichaDetalhe,
    ResultadosCategoria,
} from "@te-inscreve/schemas";
import {
    acaoSituacaoCategoriaSchema,
    formCategoriaSchema,
} from "@te-inscreve/schemas";

import {
    tagsAvaliadoresDaCategoria,
    tagsCategoria,
    tagsCategorias,
    tagsFichaDaCategoria,
    tagsResultadosDaCategoria,
} from "../cache-tags";
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
                        tags: tagsCategorias(input.modalidadeId),
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Detalhe de uma categoria.
     *
     * O recurso é aninhado até o fim, então evento e modalidade fazem parte do
     * caminho: o backend valida a cadeia inteira, e uma categoria que não
     * pertence àquela modalidade responde 404 em vez de vazar o detalhe.
     */
    getById: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<CategoriaDetalhe>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/`,
                {
                    next: {
                        revalidate: 30, // 30 segundos
                        tags: tagsCategoria(
                            input.modalidadeId,
                            input.categoriaId,
                        ),
                    },
                },
            );

            // Link antigo para categoria que já não existe é 404 de página, e
            // não erro: quem chama decide, e a página chama `notFound()`.
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }

            return result.data;
        }),

    /**
     * Altera os dados básicos de uma categoria.
     *
     * `PATCH` e não `PUT`: o serializer também expõe campos que este formulário
     * não edita, e um envio parcial evita zerá-los sem querer.
     */
    update: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
                categoria: formCategoriaSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.patch<Categoria>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/`,
                input.categoria,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Muda a situação da categoria: abre, fecha, cancela ou encerra.
     *
     * O corpo leva a ação, e não a situação de destino, e o backend valida a
     * transição: ação proibida para a situação atual responde 400 com a
     * mensagem em `detail`, que chega ao cliente em `fieldErrors`. A `situacao`
     * não muda pelo `PATCH` de `update` — lá ela é ignorada.
     */
    alterarSituacao: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
                action: acaoSituacaoCategoriaSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Categoria>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/situacao/`,
                { action: input.action },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Vincula um modelo de ficha à categoria: é por ele que os avaliadores
     * vão julgá-la. Devolve o detalhe do modelo vinculado.
     */
    vincularFichaAvaliativa: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
                fichaAvaliativaId: z.number().int().positive(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<ModeloFichaDetalhe | null>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/ficha-avaliativa/`,
                { modeloFichaAvaliativaId: input.fichaAvaliativaId },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Desfaz o vínculo da categoria com o modelo de ficha; o modelo continua
     * existindo. Depois que uma avaliação foi enviada o backend recusa com 400,
     * e a mensagem chega ao cliente em `fieldErrors`.
     */
    removerFichaAvaliativa: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.delete(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/ficha-avaliativa/`,
            );
            if (!result.ok) throw result.error;
            return { categoriaId: input.categoriaId };
        }),

    /**
     * O modelo de ficha vinculado à categoria, ou nulo quando ainda não há
     * nenhum — a aba mostra o estado vazio, e não um erro.
     */
    getFichaAvaliativa: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<ModeloFichaDetalhe | null>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/ficha-avaliativa/`,
                {
                    next: {
                        revalidate: 30,
                        tags: tagsFichaDaCategoria(input.categoriaId),
                    },
                },
            );
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }
            return result.data ?? null;
        }),

    /**
     * A classificação pública da categoria, já ordenada pela nota.
     *
     * Antes de a categoria ser encerrada o backend devolve a lista vazia, e não
     * um erro: é a `situacao` dela que diz se o resultado foi divulgado.
     */
    getResultados: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<ResultadosCategoria>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/resultados/`,
                {
                    next: {
                        revalidate: 30,
                        tags: tagsResultadosDaCategoria(input.categoriaId),
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Quem já avaliou alguma inscrição da categoria, cada um com as inscrições
     * que avaliou e a nota que deu a cada uma.
     *
     * Ao contrário da classificação, sai em qualquer situação da categoria;
     * vazia enquanto ninguém avaliou.
     */
    getAvaliadores: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                categoriaId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<AvaliadoresDaCategoria>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/categorias/${input.categoriaId}/avaliadores/`,
                {
                    next: {
                        revalidate: 30,
                        tags: tagsAvaliadoresDaCategoria(input.categoriaId),
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
