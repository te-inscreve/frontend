import type { Href } from "expo-router";

import type { CategoriaPronta } from "./listar-categorias-prontas";

/**
 * O que o detalhe precisa saber da categoria, e que o cartão passa na rota.
 *
 * Vem pelos parâmetros, e não do cache de `categorias-prontas`, para o
 * detalhe continuar de pé quando um refresh da lista tira a categoria dela.
 */
export type ParametrosDetalheCategoria = Record<
    "id" | "eventoId" | "modalidadeId" | "isGrupo" | "nome",
    string
>;

export function rotaDetalheCategoria(categoria: CategoriaPronta): Href {
    const params: ParametrosDetalheCategoria = {
        id: String(categoria.id),
        eventoId: String(categoria.eventoId),
        modalidadeId: String(categoria.modalidadeId),
        isGrupo: String(categoria.isGrupo),
        nome: categoria.nome,
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
    };
}
