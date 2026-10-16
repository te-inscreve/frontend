import type { ModeloFichaResumo } from "@te-inscreve/schemas";

/**
 * Recorte pelo nome, sem caixa e sem acento: quem digita "tecnica" acha
 * "Técnica individual".
 */
export function filtrarModelosFicha(
    modelos: ModeloFichaResumo[],
    busca: string,
): ModeloFichaResumo[] {
    const procurado = normalizar(busca.trim());
    if (!procurado) return modelos;

    return modelos.filter((modelo) =>
        normalizar(modelo.nome).includes(procurado),
    );
}

function normalizar(texto: string) {
    return texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}
