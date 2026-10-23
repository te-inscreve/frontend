import type { CategoriaPronta } from "./listar-categorias-prontas";

/** Minúsculas e sem acentos, para "gaucha" encontrar "Gaúcha". */
function normalizar(texto: string): string {
    return (
        texto
            .normalize("NFD")
            // A faixa dos acentos combinantes, que o `NFD` separa da letra.
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
    );
}

/**
 * As categorias cujo nome, evento ou modalidade contêm a busca. Filtra só o
 * que já está no aparelho; uma busca vazia devolve a lista inteira.
 */
export function filtrarCategorias(
    categorias: CategoriaPronta[],
    busca: string,
): CategoriaPronta[] {
    const termo = normalizar(busca.trim());
    if (!termo) return categorias;

    return categorias.filter((categoria) =>
        [categoria.nome, categoria.eventoNome, categoria.modalidadeNome].some(
            (campo) => normalizar(campo).includes(termo),
        ),
    );
}

/** "1 categoria" ou "N categorias", para a contagem acima da lista. */
export function rotuloQuantidadeCategorias(quantidade: number): string {
    return quantidade === 1 ? "1 categoria" : `${quantidade} categorias`;
}
