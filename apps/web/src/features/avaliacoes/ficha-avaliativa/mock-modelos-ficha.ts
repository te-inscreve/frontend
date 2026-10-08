/**
 * Modelos de ficha de exemplo.
 *
 * A API ainda não expõe modelos de ficha avaliativa. Enquanto isso, o seletor é
 * montado a partir daqui, num módulo separado para que trocar o mock pela query
 * do tRPC seja uma mudança de origem de dados, e não uma reescrita dos
 * componentes.
 *
 * O tipo abaixo é a forma que a tela espera. Quando o backend definir a dele, o
 * que sobreviver vira schema em `packages/schemas`.
 */

export interface ModeloFichaMock {
    id: number;
    nome: string;
}

export const modelosFichaMock: ModeloFichaMock[] = [
    { id: 1, nome: "Ficha padrão" },
    { id: 2, nome: "Coreografia" },
    { id: 3, nome: "Interpretação" },
    { id: 4, nome: "Técnica individual" },
    { id: 5, nome: "Conjunto instrumental" },
    { id: 6, nome: "Canto solista" },
    { id: 7, nome: "Declamação" },
    { id: 8, nome: "Pesquisa e indumentária" },
    { id: 9, nome: "Harmonia de grupo" },
    { id: 10, nome: "Mostra sem classificação" },
    { id: 11, nome: "Eliminatória" },
    { id: 12, nome: "Final" },
];

/**
 * Recorte pelo nome, sem caixa e sem acento: quem digita "tecnica" acha
 * "Técnica individual".
 */
export function filtrarModelosFicha(
    modelos: ModeloFichaMock[],
    busca: string,
): ModeloFichaMock[] {
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
