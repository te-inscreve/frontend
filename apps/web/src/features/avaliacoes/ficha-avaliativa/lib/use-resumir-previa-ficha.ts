import type { ModeloFichaResumo } from "@te-inscreve/schemas";

interface Props {
    previa: ModeloFichaResumo["previa"];
}

interface Return {
    campos: string[];
    agrupamento:
        ModeloFichaResumo["previa"]["agrupamentos"][number] | undefined;
    camposOcultos: number;
    camposAgrupadosOcultos: number;
    agrupamentosOcultos: number;
}

export function useResumirPreviaFicha({ previa }: Props): Return {
    const hasAgrupamento = previa.agrupamentos.length > 0;
    const sliceParams = hasAgrupamento ? 3 : 8;
    const agrupamento = previa.agrupamentos[0];

    return {
        campos: previa.camposGerais.slice(0, sliceParams),
        camposOcultos: Math.max(0, previa.camposGerais.length - sliceParams),
        agrupamento: agrupamento
            ? {
                  ...agrupamento,
                  campos: agrupamento.campos.slice(0, sliceParams),
              }
            : undefined,
        agrupamentosOcultos: Math.max(0, previa.agrupamentos.length - 1),
        camposAgrupadosOcultos: agrupamento
            ? Math.max(0, agrupamento.campos.length - sliceParams)
            : 0,
    };
}
