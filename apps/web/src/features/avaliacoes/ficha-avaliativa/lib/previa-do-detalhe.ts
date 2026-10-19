import type {
    ModeloFichaDetalhe,
    ModeloFichaResumo,
} from "@te-inscreve/schemas";

/**
 * A prévia do cartão a partir do detalhe do modelo: o vínculo da categoria
 * devolve o modelo inteiro, e o cartão só precisa dos nomes, na ordem.
 */
export function previaDoDetalhe(
    modelo: ModeloFichaDetalhe,
): ModeloFichaResumo["previa"] {
    const porOrdem = <T extends { ordem: number }>(itens: T[]) =>
        [...itens].sort((a, b) => a.ordem - b.ordem);

    return {
        camposGerais: porOrdem(modelo.camposGerais).map(
            (posicao) => posicao.campo.nome,
        ),
        agrupamentos: porOrdem(modelo.agrupamentos).map((agrupamento) => ({
            nome: agrupamento.nome,
            quantidade: agrupamento.quantidade,
            campos: porOrdem(agrupamento.campos).map(
                (posicao) => posicao.campo.nome,
            ),
        })),
    };
}
