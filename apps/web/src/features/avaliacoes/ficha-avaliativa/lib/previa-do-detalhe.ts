import type {
    ModeloFichaDetalhe,
    ModeloFichaResumo,
} from "@te-inscreve/schemas";

/**
 * A prévia do cartão a partir do detalhe do modelo: o vínculo da categoria
 * devolve o modelo inteiro, e o cartão só precisa dos nomes e da ordem.
 */
export function previaDoDetalhe(
    modelo: ModeloFichaDetalhe,
): ModeloFichaResumo["previa"] {
    const porOrdem = <T extends { ordem: number }>(itens: T[]) =>
        [...itens].sort((a, b) => a.ordem - b.ordem);

    const campoDa = (posicao: { ordem: number; campo: { nome: string } }) => ({
        nome: posicao.campo.nome,
        ordem: posicao.ordem,
    });

    return {
        camposGerais: porOrdem(modelo.camposGerais).map(campoDa),
        agrupamentos: porOrdem(modelo.agrupamentos).map((agrupamento) => ({
            nome: agrupamento.nome,
            quantidade: agrupamento.quantidade,
            ordem: agrupamento.ordem,
            campos: porOrdem(agrupamento.campos).map(campoDa),
        })),
    };
}
