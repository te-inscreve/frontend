import type { SituacaoCategoria } from "@te-inscreve/schemas";

import { trpcClient } from "~/utils/api";

/** A categoria `pronta_avaliacao` com o contexto que o cartão mostra. */
export interface CategoriaPronta {
    id: number;
    nome: string;
    eventoId: number;
    eventoNome: string;
    modalidadeId: number;
    modalidadeNome: string;
    /** Da modalidade: decide o bilhete das inscrições no detalhe. */
    isGrupo: boolean;
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
 * As categorias liberadas para avaliação, de todos os eventos, numa só
 * requisição a `categorias-disponiveis`.
 *
 * A visibilidade é a do endpoint: qualquer usuário autenticado vê todas as
 * categorias `pronta_avaliacao`, decisão de produto do backend. Aqui só se
 * achata a árvore evento → modalidade → categoria, mantendo a ordem dela;
 * quem chama só conhece `CategoriaPronta`.
 */
export async function listarCategoriasProntas(): Promise<CategoriaPronta[]> {
    const eventos = await trpcClient.avaliacao.getCategoriasDisponiveis.query();

    return eventos.flatMap((evento) =>
        evento.modalidades.flatMap((modalidade) =>
            modalidade.categorias.map((categoria) => ({
                id: categoria.id,
                nome: categoria.nome,
                eventoId: evento.id,
                eventoNome: evento.nome,
                modalidadeId: modalidade.id,
                modalidadeNome: modalidade.nome,
                isGrupo: modalidade.isGrupo,
                idadeMinima: categoria.idadeMinima,
                idadeMaxima: categoria.idadeMaxima,
                countInscricoes: categoria.countInscricoes,
                maxInscricoes: categoria.maxInscricoes,
                dataApresentacao: categoria.dataApresentacao,
                situacao: categoria.situacao,
            })),
        ),
    );
}
