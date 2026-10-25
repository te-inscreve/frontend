import type { Href } from "expo-router";

import type { InscricaoGrupo, InscricaoIndividual } from "@te-inscreve/schemas";

import { nomeCompleto } from "~/features/categorias/lib/integrante";

/**
 * O que a ficha precisa saber da inscrição, e que o detalhe da categoria
 * passa na rota: as chaves do modelo de ficha e da inscrição, e o que a tela
 * de sucesso mostra (quem se apresentou, de onde, em qual categoria).
 *
 * Vem pelos parâmetros, como no detalhe da categoria, para a ficha não
 * depender do cache da lista de inscrições.
 */
export type ParametrosFichaInscricao = Record<
    | "inscricaoId"
    | "eventoId"
    | "modalidadeId"
    | "categoriaId"
    | "concorrente"
    | "entidade"
    | "categoria"
    | "modalidade"
    | "evento"
    | "ordemApresentacao",
    string
>;

/** A categoria de onde a ficha é aberta, como o detalhe a lê da rota. */
interface CategoriaDaFicha {
    categoriaId: number;
    eventoId: number;
    modalidadeId: number;
    nome: string;
    eventoNome: string;
    modalidadeNome: string;
}

/**
 * Quem se apresenta na inscrição, como o bilhete o mostra: o nome do
 * concorrente, ou a entidade quando o grupo não tem nome próprio.
 */
export function nomeDoConcorrente(
    inscricao: InscricaoGrupo | InscricaoIndividual,
) {
    if ("totalIntegrantes" in inscricao)
        return inscricao.nomeConcorrente ?? inscricao.entidade.nome;
    return inscricao.concorrente
        ? nomeCompleto(inscricao.concorrente)
        : "Concorrente não informado";
}

export function rotaFichaInscricao(
    categoria: CategoriaDaFicha,
    inscricao: InscricaoGrupo | InscricaoIndividual,
): Href {
    const params: ParametrosFichaInscricao = {
        inscricaoId: String(inscricao.id),
        eventoId: String(categoria.eventoId),
        modalidadeId: String(categoria.modalidadeId),
        categoriaId: String(categoria.categoriaId),
        concorrente: nomeDoConcorrente(inscricao),
        entidade: inscricao.entidade.nome,
        categoria: categoria.nome,
        modalidade: categoria.modalidadeNome,
        evento: categoria.eventoNome,
        ordemApresentacao: String(inscricao.ordem),
    };

    return { pathname: "/categorias/ficha/[inscricaoId]", params };
}

/**
 * De onde a ficha foi aberta, quando não foi das inscrições da categoria:
 * o "Voltar" leva de volta para lá.
 */
export type OrigemDaFicha = "avaliacoes";

/**
 * A ficha de uma avaliação já guardada no aparelho, para voltar a ela de
 * outra tela (o "continuar a avaliação de X", a dock do cabeçalho, a lista
 * de avaliações).
 */
export function rotaDaAvaliacaoLocal(
    avaliacao: {
        eventoId: number;
        modalidadeId: number;
        categoriaId: number;
        inscricaoId: number;
        inscricao: InscricaoAvaliada;
    },
    origem?: OrigemDaFicha,
): Href {
    const params: ParametrosFichaInscricao & { origem?: OrigemDaFicha } = {
        ...(origem && { origem }),
        inscricaoId: String(avaliacao.inscricaoId),
        eventoId: String(avaliacao.eventoId),
        modalidadeId: String(avaliacao.modalidadeId),
        categoriaId: String(avaliacao.categoriaId),
        ...avaliacao.inscricao,
        ordemApresentacao: String(avaliacao.inscricao.ordemApresentacao),
    };

    return { pathname: "/categorias/ficha/[inscricaoId]", params };
}

/** Quem foi avaliado, como a tela de sucesso o mostra. */
export type InscricaoAvaliada = ReturnType<
    typeof lerParametrosFichaInscricao
>["inscricao"];

/** O caminho de volta de {@link rotaFichaInscricao}, na tela da ficha. */
export function lerParametrosFichaInscricao(
    params: ParametrosFichaInscricao & { origem?: string },
) {
    return {
        origem:
            params.origem === "avaliacoes"
                ? ("avaliacoes" as const satisfies OrigemDaFicha)
                : undefined,
        inscricaoId: Number(params.inscricaoId),
        eventoId: Number(params.eventoId),
        modalidadeId: Number(params.modalidadeId),
        categoriaId: Number(params.categoriaId),
        inscricao: {
            concorrente: params.concorrente,
            entidade: params.entidade,
            categoria: params.categoria,
            modalidade: params.modalidade,
            evento: params.evento,
            ordemApresentacao: Number(params.ordemApresentacao),
        },
    };
}
