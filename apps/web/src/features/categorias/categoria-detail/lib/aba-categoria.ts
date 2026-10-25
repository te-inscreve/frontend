/** As abas do painel principal do detalhe da categoria. */
export const ABAS_CATEGORIA = [
    "inscritos",
    "cronograma",
    "classificacoes",
] as const;

export type AbaCategoria = (typeof ABAS_CATEGORIA)[number];

/**
 * A aba que abre primeiro, vinda do `?aba=` — é assim que um link leva direto
 * à classificação. Ausente, repetida ou desconhecida, cai nos inscritos.
 */
export function lerAbaCategoria(aba: string | string[] | undefined) {
    return ABAS_CATEGORIA.find((valor) => valor === aba) ?? "inscritos";
}
