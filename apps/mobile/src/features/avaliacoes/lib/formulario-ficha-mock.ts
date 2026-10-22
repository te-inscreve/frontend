import { z } from "zod/v4";

import type {
    AgrupamentoFicha,
    CampoFicha,
    ModeloFichaDetalhe,
    PosicaoFicha,
} from "@te-inscreve/schemas";

/*
 * MOCK (TE-82): o builder modelo de ficha → formulário, provisório e local ao
 * app até as decisões em aberto no mapa TE-64 — forma do estado (TE-98), valor
 * do NUMERICO (TE-97), controles (TE-99) e nota (TE-95). O builder definitivo
 * mora em `packages/schemas`.
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

/*
 * Nomes planos, sem ponto: o RHF trataria `a.b` como caminho aninhado.
 */
export const chaveGeral = (posicao: PosicaoFicha) => `g${posicao.id}`;
export const chaveDaOcorrencia = (
    agrupamento: AgrupamentoFicha,
    ordem: number,
    posicao: PosicaoFicha,
) => `a${agrupamento.id}_${ordem}_${posicao.id}`;

export type ValorCampo = string | number | number[] | null;
export type ValoresFicha = Record<string, ValorCampo>;

function valorInicial(campo: CampoFicha): ValorCampo {
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

const DECIMAL = /^\d+([.,]\d{1,4})?$/;

/**
 * A nota digitada, com o ponto trocado pela vírgula decimal e presa ao teto:
 * quem passa do máximo fica no máximo ("12" vira "10" num campo até 10). O
 * resto — casas demais, texto que não é número — fica para a validação.
 */
export function notaDigitada(campo: CampoFicha, digitado: string) {
    const texto = digitado.replaceAll(".", ",");
    const teto = tetoDoCampo(campo);
    if (teto !== null && Number(texto.replace(",", ".")) > teto)
        return formatarDecimal(teto);
    return texto;
}

function schemaDoCampo(campo: CampoFicha) {
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

/** Cada campo de cada item do topo, com a chave dele no formulário. */
function camposComChave(modelo: ModeloFichaDetalhe) {
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

/**
 * O que abre na folha de edição ao tocar na ficha: um campo geral sozinho, ou
 * uma ocorrência de agrupamento com todos os campos dela. Campos gerais não
 * se agrupam: o modelo não diz quais andam juntos, então cada um abre só.
 */
export interface TrechoFicha {
    chave: string;
    titulo: string;
    subtitulo?: string;
    campos: { chave: string; campo: CampoFicha }[];
    /** Só nos trechos de ocorrência: de qual agrupamento, e qual repetição. */
    ocorrencia?: { agrupamento: AgrupamentoFicha; ordem: number };
}

/** Os trechos na ordem do topo da ficha, a ordem de "Anterior"/"Próximo". */
export function trechosDaFicha(modelo: ModeloFichaDetalhe): TrechoFicha[] {
    return itensDoTopo(modelo).map((item) =>
        item.tipo === "geral"
            ? {
                  chave: item.chave,
                  titulo: "Campos gerais",
                  campos: [{ chave: item.chave, campo: item.posicao.campo }],
              }
            : {
                  chave: item.chave,
                  titulo: `${item.agrupamento.nome} ${item.ordem}`,
                  subtitulo: `Ocorrência ${item.ordem} de ${item.agrupamento.quantidade}`,
                  ocorrencia: {
                      agrupamento: item.agrupamento,
                      ordem: item.ordem,
                  },
                  campos: camposDoAgrupamento(item.agrupamento).map(
                      (posicao) => ({
                          chave: chaveDaOcorrencia(
                              item.agrupamento,
                              item.ordem,
                              posicao,
                          ),
                          campo: posicao.campo,
                      }),
                  ),
              },
    );
}

/** A resposta como texto curto, para a revisão. */
export function resumoDoValor(campo: CampoFicha, valor: ValorCampo) {
    const nomeDa = (id: number) =>
        campo.alternativas?.find((alternativa) => alternativa.id === id)?.nome;
    const ordemDa = (id: number) =>
        campo.alternativas?.find((alternativa) => alternativa.id === id)
            ?.ordem ?? 0;

    // Na ordem do modelo, não na ordem em que o avaliador tocou.
    if (Array.isArray(valor))
        return valor.length
            ? [...valor]
                  .sort((a, b) => ordemDa(a) - ordemDa(b))
                  .map(nomeDa)
                  .join(", ")
            : null;
    if (typeof valor === "number") return nomeDa(valor) ?? null;
    // Texto só com espaços também é "sem resposta".
    const texto = valor?.trim();
    if (!texto) return null;
    return texto;
}

export function montarFormularioFicha(modelo: ModeloFichaDetalhe) {
    const campos = camposComChave(modelo);

    return {
        // As chaves só existem em tempo de execução: para o RHF, o schema é
        // um registro de valores de campo.
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

/** A aba de um trecho: a dos campos gerais ou a do agrupamento dele. */
export function abaDoTrecho(trecho: TrechoFicha) {
    return trecho.ocorrencia
        ? `agrupamento-${trecho.ocorrencia.agrupamento.id}`
        : "gerais";
}

/** Uma aba da ficha, com o índice do trecho que cada linha abre. */
export type AbaDaFicha =
    | {
          chave: string;
          tipo: "campos";
          titulo: string;
          /** Uma linha por campo geral, cada um o seu trecho. */
          linhas: { trecho: number; chave: string; campo: CampoFicha }[];
      }
    | {
          chave: string;
          tipo: "agrupamento";
          titulo: string;
          agrupamento: AgrupamentoFicha;
          /** Uma linha por ocorrência, cada uma o seu trecho. */
          linhas: {
              trecho: number;
              ordem: number;
              campos: TrechoFicha["campos"];
          }[];
      };

/**
 * As abas da ficha: uma com todos os campos gerais, primeiro, e uma por
 * agrupamento, na ordem em que aparecem no modelo. Os campos gerais vêm
 * misturados aos agrupamentos na ordem do topo; numa aba só, ficam juntos.
 */
export function abasDaFicha(trechos: TrechoFicha[]): AbaDaFicha[] {
    const gerais: Extract<AbaDaFicha, { tipo: "campos" }> = {
        chave: "gerais",
        tipo: "campos",
        titulo: "Campos gerais",
        linhas: [],
    };
    const agrupamentos = new Map<
        number,
        Extract<AbaDaFicha, { tipo: "agrupamento" }>
    >();

    trechos.forEach((trecho, indice) => {
        if (!trecho.ocorrencia) {
            gerais.linhas.push(
                ...trecho.campos.map(({ chave, campo }) => ({
                    trecho: indice,
                    chave,
                    campo,
                })),
            );
            return;
        }

        const { agrupamento, ordem } = trecho.ocorrencia;
        const aba = agrupamentos.get(agrupamento.id) ?? {
            chave: abaDoTrecho(trecho),
            tipo: "agrupamento" as const,
            titulo: agrupamento.nome,
            agrupamento,
            linhas: [],
        };
        aba.linhas.push({ trecho: indice, ordem, campos: trecho.campos });
        agrupamentos.set(agrupamento.id, aba);
    });

    // Dois agrupamentos com o mesmo nome dariam duas abas iguais: levam o
    // número da vez, entre parênteses para não confundir com a ocorrência.
    const doAgrupamento = [...agrupamentos.values()];
    const repeticoes = new Map<string, number>();
    doAgrupamento.forEach(({ titulo }) =>
        repeticoes.set(titulo, (repeticoes.get(titulo) ?? 0) + 1),
    );
    const vistos = new Map<string, number>();
    doAgrupamento.forEach((aba) => {
        if ((repeticoes.get(aba.titulo) ?? 0) < 2) return;
        const vez = (vistos.get(aba.titulo) ?? 0) + 1;
        vistos.set(aba.titulo, vez);
        aba.titulo = `${aba.titulo} (${vez})`;
    });

    return [...(gerais.linhas.length ? [gerais] : []), ...doAgrupamento];
}
