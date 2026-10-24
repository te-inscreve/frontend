import type { z } from "zod/v4";

import type { modificadorNotaSchema } from "./ficha-avaliativa";

/**
 * A nota de uma avaliação, com a mesma fórmula do backend
 * (`apps/avaliacoes/services/calculo_nota_service.py`, TE-61; decidido em
 * TE-95):
 *
 * 1. o subtotal de cada unidade — cada ocorrência de qualquer agrupamento — é
 *    a soma dos SOMA menos a dos DESCONTA;
 * 2. a média é sobre todas as unidades, de todos os agrupamentos; unidade sem
 *    nota conta como 0 e entra no divisor;
 * 3. os campos gerais somam ou descontam depois da média;
 * 4. teto em 10, sem piso: a nota pode ser negativa;
 * 5. arredonda para baixo (em direção a −∞) só no fim, a 4 casas.
 *
 * Aqui ela é prévia: quem vale é a nota que o servidor grava.
 *
 * O backend conta em `Decimal`; aqui a conta é em inteiros de 0,0001, o que
 * dá o mesmo resultado sem erro de ponto flutuante. Com a média em `s / n`,
 * `floor(s / n + g)` é `floorDiv(s, n) + g`, porque `g` já é inteiro nessa
 * escala. Os valores cabem em `decimal(12,4)` (até ~1e12 escalados), longe do
 * limite seguro do `number`.
 */

type ModificadorNota = z.infer<typeof modificadorNotaSchema>;

/**
 * Uma resposta numérica. O `valor` é a string do formulário — com vírgula ou
 * ponto, como digitada (TE-97). Vazio ou inválido conta como sem resposta,
 * para a prévia andar enquanto o avaliador preenche.
 */
export interface RespostaNota {
    modificador: ModificadorNota;
    valor: string | null | undefined;
}

export interface EntradaNota {
    gerais: RespostaNota[];
    /** Uma lista de respostas por unidade, de todos os agrupamentos. */
    unidades: RespostaNota[][];
}

const ESCALA = 10_000;
const TETO = 10 * ESCALA;
const DECIMAL = /^(\d+)(?:[.,](\d{1,4}))?$/;

/**
 * `"8,5"` → `85000`; nulo quando não é um decimal não negativo de até 4 casas,
 * os mesmos que o backend aceita.
 */
function escalado(valor: string | null | undefined) {
    const casou = DECIMAL.exec(valor?.trim() ?? "");
    if (!casou) return null;
    const [, inteiro = "", fracao = ""] = casou;
    return Number(inteiro) * ESCALA + Number(fracao.padEnd(4, "0"));
}

function subtotal(respostas: RespostaNota[]) {
    return respostas.reduce((total, { modificador, valor }) => {
        const numero = escalado(valor);
        if (numero === null) return total;
        return modificador === "DESCONTA" ? total - numero : total + numero;
    }, 0);
}

/** Divisão inteira arredondada para −∞, como o `ROUND_FLOOR`. */
function divisaoPiso(dividendo: number, divisor: number) {
    const resto = dividendo % divisor;
    const quociente = (dividendo - resto) / divisor;
    return resto < 0 ? quociente - 1 : quociente;
}

/** `76666` → `"7.6666"`, `-3334` → `"-0.3334"`: o formato da API. */
function formatado(escalado: number) {
    const absoluto = Math.abs(escalado);
    const fracao = String(absoluto % ESCALA).padStart(4, "0");
    const inteiro = Math.floor(absoluto / ESCALA);
    return `${escalado < 0 ? "-" : ""}${inteiro}.${fracao}`;
}

/**
 * O subtotal de uma unidade — uma ocorrência de agrupamento —, ou dos campos
 * gerais: soma menos desconto, sem teto, em decimal com 4 casas. É o total da
 * linha que a ficha mostra antes da média.
 */
export function calcularSubtotal(respostas: RespostaNota[]): string {
    return formatado(subtotal(respostas));
}

/** A nota final, como a API a devolve: decimal em string com 4 casas. */
export function calcularNota({ gerais, unidades }: EntradaNota): string {
    const media = unidades.length
        ? divisaoPiso(
              unidades.reduce((soma, unidade) => soma + subtotal(unidade), 0),
              unidades.length,
          )
        : 0;
    return formatado(Math.min(media + subtotal(gerais), TETO));
}
