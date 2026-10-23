import type { Href } from "expo-router";

import type { SituacaoCategoria } from "@te-inscreve/schemas";

import type { CategoriaPronta } from "./listar-categorias-prontas";

/**
 * O que o detalhe precisa saber da categoria, e que o cartão passa na rota:
 * as chaves das inscrições e o que o cabeçalho do detalhe mostra.
 *
 * Vem pelos parâmetros, e não do cache de `categorias-prontas`, para o
 * detalhe continuar de pé quando um refresh da lista tira a categoria dela.
 */
export type ParametrosDetalheCategoria = Record<
    | "id"
    | "eventoId"
    | "modalidadeId"
    | "isGrupo"
    | "nome"
    | "eventoNome"
    | "modalidadeNome"
    | "idadeMinima"
    | "idadeMaxima"
    | "dataApresentacao"
    | "situacao"
    | "situacaoLabel",
    string
>;

export function rotaDetalheCategoria(categoria: CategoriaPronta): Href {
    const params: ParametrosDetalheCategoria = {
        id: String(categoria.id),
        eventoId: String(categoria.eventoId),
        modalidadeId: String(categoria.modalidadeId),
        isGrupo: String(categoria.isGrupo),
        nome: categoria.nome,
        eventoNome: categoria.eventoNome,
        modalidadeNome: categoria.modalidadeNome,
        idadeMinima: String(categoria.idadeMinima),
        idadeMaxima: String(categoria.idadeMaxima),
        // Parâmetro de rota é texto: vazio é a categoria fora do cronograma.
        dataApresentacao: categoria.dataApresentacao ?? "",
        situacao: categoria.situacao.value,
        situacaoLabel: categoria.situacao.label,
    };

    return { pathname: "/categorias/[id]", params };
}

/** O caminho de volta de {@link rotaDetalheCategoria}, na tela de detalhe. */
export function lerParametrosDetalheCategoria(
    params: ParametrosDetalheCategoria,
) {
    return {
        categoriaId: Number(params.id),
        eventoId: Number(params.eventoId),
        modalidadeId: Number(params.modalidadeId),
        isGrupo: params.isGrupo === "true",
        nome: params.nome,
        eventoNome: params.eventoNome,
        modalidadeNome: params.modalidadeNome,
        idadeMinima: Number(params.idadeMinima),
        idadeMaxima: Number(params.idadeMaxima),
        dataApresentacao: params.dataApresentacao || null,
        situacao: {
            value: params.situacao as SituacaoCategoria["value"],
            label: params.situacaoLabel,
        },
    };
}
