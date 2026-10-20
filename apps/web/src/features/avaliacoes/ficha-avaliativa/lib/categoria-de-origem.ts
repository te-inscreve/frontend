import { parseInteger } from "~/shared/utils/parsers";

/**
 * A categoria que abriu o editor de modelo pelo seletor de ficha. Viaja na
 * URL do editor para que, criado o modelo, ele já seja vinculado a ela e a
 * pessoa volte para onde estava.
 *
 * Só ids, e não um caminho de volta pronto: o caminho é montado aqui, então a
 * URL não serve de redirecionamento para fora do admin.
 */
export interface CategoriaDeOrigem {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

type ParametrosDeBusca = Record<string, string | string[] | undefined>;

export function caminhoDaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: CategoriaDeOrigem) {
    return `/admin/eventos/${eventoId}/modalidades/${modalidadeId}/categorias/${categoriaId}`;
}

export function caminhoCriarModeloParaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: CategoriaDeOrigem) {
    const busca = new URLSearchParams({
        evento: String(eventoId),
        modalidade: String(modalidadeId),
        categoria: String(categoriaId),
    });
    return `/admin/fichas-avaliativas/criar?${busca.toString()}`;
}

/** A categoria da URL do editor, ou `undefined` se falta ou sobra algo. */
export function lerCategoriaDeOrigem(
    busca: ParametrosDeBusca,
): CategoriaDeOrigem | undefined {
    const eventoId = parseInteger(busca.evento);
    const modalidadeId = parseInteger(busca.modalidade);
    const categoriaId = parseInteger(busca.categoria);
    if (!eventoId || !modalidadeId || !categoriaId) return undefined;
    return { eventoId, modalidadeId, categoriaId };
}
