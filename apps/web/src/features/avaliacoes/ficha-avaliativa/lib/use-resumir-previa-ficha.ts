import type { ModeloFichaResumo } from "@te-inscreve/schemas";

type Previa = ModeloFichaResumo["previa"];

interface Props {
    previa: Previa;
}

/**
 * Um trecho da folha do cartão, na ordem da ficha:
 *
 * - `campos` — campos gerais seguidos que couberam;
 * - `agrupamento` — o primeiro agrupamento, com os campos que couberam e
 *   quantos ficaram de fora;
 * - `ocultos` — o que não coube naquele ponto, campos gerais e agrupamentos,
 *   numa contagem só.
 */
export type TrechoPrevia =
    | { tipo: "campos"; campos: string[] }
    | {
          tipo: "agrupamento";
          nome: string;
          quantidade: number;
          campos: string[];
          camposOcultos: number;
      }
    | { tipo: "ocultos"; campos: number; agrupamentos: number };

interface Return {
    trechos: TrechoPrevia[];
}

/**
 * O que cabe na folha do cartão, na ordem da ficha — campos gerais e
 * agrupamentos se intercalam.
 *
 * Sem agrupamento, até oito campos gerais. Com agrupamento, os campos gerais
 * cedem espaço — até três, somando todos os trechos — para que o primeiro
 * agrupamento, também com até três campos, nunca fique de fora. Os demais
 * agrupamentos não são desenhados. O que não coube vira uma contagem no
 * ponto em que foi cortado, e cortes vizinhos somam numa contagem só.
 */
export function useResumirPreviaFicha({ previa }: Props): Return {
    const temAgrupamento = previa.agrupamentos.length > 0;
    const limite = temAgrupamento ? 3 : 8;
    let camposRestantes = limite;
    let agrupamentoDesenhado = false;
    const trechos: TrechoPrevia[] = [];

    function ocultar(campos: number, agrupamentos: number) {
        const ultimo = trechos.at(-1);
        if (ultimo?.tipo === "ocultos") {
            ultimo.campos += campos;
            ultimo.agrupamentos += agrupamentos;
            return;
        }
        trechos.push({ tipo: "ocultos", campos, agrupamentos });
    }

    for (const item of sequenciaDaPrevia(previa)) {
        if (item.tipo === "agrupamento") {
            if (agrupamentoDesenhado) {
                ocultar(0, 1);
                continue;
            }
            agrupamentoDesenhado = true;
            const campos = porOrdem(item.agrupamento.campos);
            trechos.push({
                tipo: "agrupamento",
                nome: item.agrupamento.nome,
                quantidade: item.agrupamento.quantidade,
                campos: campos.slice(0, limite).map((campo) => campo.nome),
                camposOcultos: Math.max(0, campos.length - limite),
            });
            continue;
        }

        if (camposRestantes === 0) {
            ocultar(1, 0);
            continue;
        }
        camposRestantes -= 1;
        const ultimo = trechos.at(-1);
        if (ultimo?.tipo === "campos") ultimo.campos.push(item.nome);
        else trechos.push({ tipo: "campos", campos: [item.nome] });
    }

    return { trechos };
}

type ItemDaPrevia =
    | { tipo: "campo"; nome: string; ordem: number }
    | {
          tipo: "agrupamento";
          ordem: number;
          agrupamento: Previa["agrupamentos"][number];
      };

/**
 * Campos gerais e agrupamentos numa sequência só: o backend numera os dois
 * juntos, então a `ordem` diz quem vem antes de quem.
 */
function sequenciaDaPrevia(previa: Previa): ItemDaPrevia[] {
    return porOrdem<ItemDaPrevia>([
        ...previa.camposGerais.map((campo) => ({
            tipo: "campo" as const,
            ...campo,
        })),
        ...previa.agrupamentos.map((agrupamento) => ({
            tipo: "agrupamento" as const,
            ordem: agrupamento.ordem,
            agrupamento,
        })),
    ]);
}

function porOrdem<T extends { ordem: number }>(itens: T[]) {
    return [...itens].sort((a, b) => a.ordem - b.ordem);
}
