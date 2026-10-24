import { z } from "zod/v4";

import type {
    AgrupamentoFicha,
    CampoFicha,
    ModeloFichaDetalhe,
    PosicaoFicha,
} from "./ficha-avaliativa";

/**
 * O builder modelo de ficha → formulário (TE-82): a ordem em que os campos
 * aparecem e o schema Zod que os valida, para o mobile e o web.
 *
 * O valor de cada tipo segue TE-97: o NUMERICO é a string como digitada, com
 * vírgula decimal; a alternativa única é o `id` escolhido ou nulo; a múltipla,
 * a lista de `id`s; descritivo e observação, texto. A conversão para o payload
 * (`"8.0000"`) fica para o envio.
 *
 * A forma do estado como um todo — um registro plano com as chaves de
 * `chaveGeral` e `chaveDaOcorrencia` — segue em aberto em TE-98: é a do
 * protótipo, e muda se o estado passar a espelhar o payload.
 */

/** Um item do topo da ficha: um campo geral ou uma ocorrência de agrupamento. */
export type ItemDoTopo =
    | { tipo: "geral"; chave: string; posicao: PosicaoFicha }
    | {
          tipo: "ocorrencia";
          chave: string;
          agrupamento: AgrupamentoFicha;
          /** De 1 a `quantidade`. */
          ordem: number;
      };

/*
 * Nomes planos, sem ponto: o React Hook Form trataria `a.b` como caminho
 * aninhado.
 */
export const chaveGeral = (posicao: PosicaoFicha) => `g${posicao.id}`;
export const chaveDaOcorrencia = (
    agrupamento: AgrupamentoFicha,
    ordem: number,
    posicao: PosicaoFicha,
) => `a${agrupamento.id}_${ordem}_${posicao.id}`;

/**
 * Campos gerais e agrupamentos pela `ordem` do topo; no empate (modelos
 * anteriores à ordem única, como o 11006), o campo geral vem antes. Cada
 * agrupamento se desdobra em `quantidade` ocorrências.
 */
export function itensDoTopo(modelo: ModeloFichaDetalhe): ItemDoTopo[] {
    const topo: { ordem: number; empate: number; itens: ItemDoTopo[] }[] = [
        ...modelo.camposGerais.map((posicao) => ({
            ordem: posicao.ordem,
            empate: 0,
            itens: [
                {
                    tipo: "geral" as const,
                    chave: chaveGeral(posicao),
                    posicao,
                },
            ],
        })),
        ...modelo.agrupamentos.map((agrupamento) => ({
            ordem: agrupamento.ordem,
            empate: 1,
            itens: Array.from({ length: agrupamento.quantidade }, (_, i) => ({
                tipo: "ocorrencia" as const,
                chave: `a${agrupamento.id}_${i + 1}`,
                agrupamento,
                ordem: i + 1,
            })),
        })),
    ];

    return topo
        .sort((a, b) => a.ordem - b.ordem || a.empate - b.empate)
        .flatMap((entrada) => entrada.itens);
}

/** Campos do agrupamento na `ordem` deles. */
export function camposDoAgrupamento(agrupamento: AgrupamentoFicha) {
    return [...agrupamento.campos].sort((a, b) => a.ordem - b.ordem);
}

export type ValorCampo = string | number | number[] | null;
export type ValoresFicha = Record<string, ValorCampo>;

/** O valor de um campo ainda não respondido. */
export function valorInicial(campo: CampoFicha): ValorCampo {
    if (campo.tipo === "ALTERNATIVA_UNICA") return null;
    if (campo.tipo === "ALTERNATIVA_MULTIPLA") return [];
    return "";
}

/** O teto do numérico como número, ou nulo quando a ficha não define um. */
export const tetoDoCampo = (campo: CampoFicha) =>
    campo.valorMaximo == null ? null : Number(campo.valorMaximo);

/** `10.0000` → `10`, `0.5` → `0,5`. */
export const formatarDecimal = (valor: number) =>
    String(valor).replace(".", ",");

/** Não negativo, até 4 casas, com vírgula ou ponto: o que o backend aceita. */
const DECIMAL = /^\d+([.,]\d{1,4})?$/;

/**
 * O schema do valor de um campo, pelo tipo dele. Opcional aceita o valor
 * inicial (vazio, nulo, lista vazia); obrigatório cobra uma resposta.
 */
export function schemaDoCampo(campo: CampoFicha) {
    switch (campo.tipo) {
        case "NUMERICO": {
            const teto = tetoDoCampo(campo);
            return z
                .string()
                .trim()
                .superRefine((valor, ctx) => {
                    if (!valor) {
                        if (campo.obrigatorio)
                            ctx.addIssue({
                                code: "custom",
                                message: "Informe a nota.",
                            });
                        return;
                    }
                    if (!DECIMAL.test(valor)) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Use um número com até 4 casas decimais.",
                        });
                        return;
                    }
                    if (teto !== null && Number(valor.replace(",", ".")) > teto)
                        ctx.addIssue({
                            code: "custom",
                            message: `O máximo é ${formatarDecimal(teto)}.`,
                        });
                });
        }
        case "ALTERNATIVA_UNICA":
            return z
                .number()
                .nullable()
                .refine((valor) => !campo.obrigatorio || valor !== null, {
                    message: "Escolha uma alternativa.",
                });
        case "ALTERNATIVA_MULTIPLA":
            return z
                .array(z.number())
                .refine((valor) => !campo.obrigatorio || valor.length > 0, {
                    message: "Escolha ao menos uma alternativa.",
                });
        case "DESCRITIVO":
        case "OBSERVACAO":
            return z
                .string()
                .trim()
                .refine((valor) => !campo.obrigatorio || valor.length > 0, {
                    message: "Preencha este campo.",
                });
    }
}

/** Cada campo de cada item do topo, na ordem, com a chave dele no formulário. */
export function camposComChave(modelo: ModeloFichaDetalhe) {
    return itensDoTopo(modelo).flatMap((item) =>
        item.tipo === "geral"
            ? [{ chave: item.chave, campo: item.posicao.campo }]
            : camposDoAgrupamento(item.agrupamento).map((posicao) => ({
                  chave: chaveDaOcorrencia(
                      item.agrupamento,
                      item.ordem,
                      posicao,
                  ),
                  campo: posicao.campo,
              })),
    );
}

/** O schema e os valores iniciais do formulário de um modelo de ficha. */
export function montarFormularioFicha(modelo: ModeloFichaDetalhe) {
    const campos = camposComChave(modelo);

    return {
        // As chaves só existem em tempo de execução: para o React Hook Form,
        // o schema é um registro de valores de campo.
        schema: z.object(
            Object.fromEntries(
                campos.map(({ chave, campo }) => [chave, schemaDoCampo(campo)]),
            ),
        ) as unknown as z.ZodType<ValoresFicha, ValoresFicha>,
        defaultValues: Object.fromEntries(
            campos.map(({ chave, campo }) => [chave, valorInicial(campo)]),
        ),
    };
}
