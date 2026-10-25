import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import {
    avaliacaoDaInscricaoSchema,
    avaliacaoDetalheSchema,
    avaliacaoEnviadaSchema,
    categoriasDisponiveisSchema,
    envioAvaliacaoSchema,
    minhasAvaliacoesSchema,
    paginadoSchema,
} from "@te-inscreve/schemas";

import { authenticatedProcedure } from "../trpc";

const idSchema = z.number().int().positive();

const caminhoDaInscricao = z.object({
    eventoId: idSchema,
    modalidadeId: idSchema,
    categoriaId: idSchema,
    inscricaoId: idSchema,
});

const avaliacoesDaInscricaoSchema = z.union([
    z.array(avaliacaoDaInscricaoSchema),
    paginadoSchema(avaliacaoDaInscricaoSchema),
]);

function urlDaInscricao(caminho: z.infer<typeof caminhoDaInscricao>) {
    return `/eventos/${caminho.eventoId}/modalidades/${caminho.modalidadeId}/categorias/${caminho.categoriaId}/inscricoes/${caminho.inscricaoId}`;
}

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

    /**
     * As avaliações já enviadas para uma inscrição, de todos os avaliadores.
     * É a consulta do 409 (TE-68): se uma é do avaliador logado, o envio que
     * deu conflito já tinha chegado.
     *
     * Aceita a lista pura ou o envelope paginado: o contrato não diz qual o
     * backend usa aqui.
     */
    getDaInscricao: authenticatedProcedure
        .input(caminhoDaInscricao)
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<unknown>(
                `${urlDaInscricao(input)}/avaliacoes/`,
            );
            if (!result.ok) throw result.error;
            const lista = avaliacoesDaInscricaoSchema.parse(result.data);
            return Array.isArray(lista) ? lista : lista.items;
        }),

    /**
     * Uma avaliação já enviada, com todas as respostas. Só leitura: depois de
     * enviada, a avaliação não muda — daí o cache, sem tag para derrubar.
     *
     * Nulo no 404 — cadeia de ids inválida, ou avaliação de outra inscrição —:
     * link velho é página inexistente, e quem decide é a página.
     */
    getById: authenticatedProcedure
        .input(caminhoDaInscricao.extend({ avaliacaoId: idSchema }))
        .query(async ({ ctx, input }) => {
            const { avaliacaoId, ...caminho } = input;
            const result = await ctx.restClient.get<unknown>(
                `${urlDaInscricao(caminho)}/avaliacoes/${avaliacaoId}/`,
                { next: { revalidate: 300 } },
            );
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }
            return avaliacaoDetalheSchema.parse(result.data);
        }),

    /**
     * Envia a avaliação de uma inscrição, feita pelo avaliador logado (que o
     * backend tira da sessão). Sem cache nem nova tentativa aqui: quem decide
     * repetir é a fila do app, pelo status.
     *
     * Toda recusa chega ao cliente com o status do Django em
     * `error.data.upstreamStatus` e o corpo em `error.data.upstreamBody`:
     * `erros[]` no 400, `detail` no 409.
     */
    enviar: authenticatedProcedure
        .input(caminhoDaInscricao.extend({ avaliacao: envioAvaliacaoSchema }))
        .mutation(async ({ ctx, input }) => {
            const { avaliacao, ...caminho } = input;
            const result = await ctx.restClient.post<unknown>(
                `${urlDaInscricao(caminho)}/avaliacoes/`,
                avaliacao,
            );
            if (!result.ok) throw result.error;
            return avaliacaoEnviadaSchema.parse(result.data);
        }),
} satisfies TRPCRouterRecord;
