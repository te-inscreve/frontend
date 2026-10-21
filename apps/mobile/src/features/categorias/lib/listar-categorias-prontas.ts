import type { SituacaoCategoria } from "@te-inscreve/schemas";

import { queryClient, trpc } from "~/utils/api";

/** A categoria `pronta_avaliacao` com o contexto que o cartão mostra. */
export interface CategoriaPronta {
    id: number;
    nome: string;
    eventoId: number;
    eventoNome: string;
    modalidadeId: number;
    modalidadeNome: string;
    idadeMinima: number;
    idadeMaxima: number;
    countInscricoes: number;
    /** Nulo quando a categoria não tem teto de inscrições. */
    maxInscricoes: number | null;
    /** ISO 8601; nulo quando a categoria ainda não está no cronograma. */
    dataApresentacao: string | null;
    situacao: SituacaoCategoria;
}

/**
 * As categorias liberadas para avaliação, de todos os eventos.
 *
 * Provisória: faz o fan-out eventos → modalidades → categorias e filtra a
 * situação aqui, sem filtrar por avaliador. É o único ponto a trocar quando a
 * API tiver o vínculo avaliador ↔ categoria e um endpoint próprio; quem chama
 * só conhece `CategoriaPronta`.
 */
export async function listarCategoriasProntas(): Promise<CategoriaPronta[]> {
    const eventos = await queryClient.fetchQuery(
        trpc.evento.getAll.queryOptions(),
    );

    const porEvento = await Promise.all(
        eventos.map(async (evento) => {
            const modalidades = await queryClient.fetchQuery(
                trpc.modalidade.getAll.queryOptions({ eventoId: evento.id }),
            );

            return Promise.all(
                modalidades.map(async (modalidade) => {
                    const categorias = await queryClient.fetchQuery(
                        trpc.categoria.getAll.queryOptions({
                            eventoId: evento.id,
                            modalidadeId: modalidade.id,
                        }),
                    );

                    return categorias
                        .filter(
                            (categoria) =>
                                categoria.situacao.value === "pronta_avaliacao",
                        )
                        .map((categoria) => ({
                            id: categoria.id,
                            nome: categoria.nome,
                            eventoId: evento.id,
                            eventoNome: evento.nome,
                            modalidadeId: modalidade.id,
                            modalidadeNome: modalidade.nome,
                            idadeMinima: categoria.idadeMinima,
                            idadeMaxima: categoria.idadeMaxima,
                            countInscricoes: categoria.countInscricoes,
                            maxInscricoes: categoria.maxInscricoes,
                            dataApresentacao: categoria.dataApresentacao,
                            situacao: categoria.situacao,
                        }));
                }),
            );
        }),
    );

    return porEvento.flat(2);
}
