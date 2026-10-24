import { z } from "zod/v4";

import type { EnvioAvaliacao, RespostaEnvio } from "./envio-avaliacao";
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
 * O estado do formulário é um registro plano, com uma chave por posição
 * (`chaveGeral`, `chaveDaOcorrencia`) e uma pelo nome de cada ocorrência
 * (`chaveNome`). O que se guarda é o payload de envio (TE-98):
 * `formularioDoPayload` e `payloadDoFormulario` convertem entre os dois. As
 * chaves por posição não mudam enquanto o avaliador preenche; os índices do
 * payload, sim, porque resposta em branco não entra nele.
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
export const chaveNome = (agrupamento: AgrupamentoFicha, ordem: number) =>
    `n${agrupamento.id}_${ordem}`;

/** O nome com que a ocorrência nasce, e ao qual volta se for apagado. */
export const nomePadrao = (agrupamento: AgrupamentoFicha, ordem: number) =>
    `${agrupamento.nome} ${ordem}`;

/** O tamanho máximo do nome da ocorrência no backend. */
export const MAXIMO_NOME_OCORRENCIA = 255;

/**
 * O nome da ocorrência: até 255 caracteres e não vazio. A interface devolve
 * o nome padrão quando ele é apagado, então o erro de vazio é só uma rede.
 */
export const nomeOcorrenciaSchema = z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(MAXIMO_NOME_OCORRENCIA, "Use até 255 caracteres.");

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

/** O nome de cada ocorrência, com a chave dele no formulário. */
function ocorrenciasComChave(modelo: ModeloFichaDetalhe) {
    return itensDoTopo(modelo).flatMap((item) =>
        item.tipo === "ocorrencia"
            ? [
                  {
                      chave: chaveNome(item.agrupamento, item.ordem),
                      agrupamento: item.agrupamento,
                      ordem: item.ordem,
                  },
              ]
            : [],
    );
}

/** O schema e os valores iniciais do formulário de um modelo de ficha. */
export function montarFormularioFicha(modelo: ModeloFichaDetalhe) {
    const campos = camposComChave(modelo);
    const ocorrencias = ocorrenciasComChave(modelo);

    return {
        // As chaves só existem em tempo de execução: para o React Hook Form,
        // o schema é um registro de valores de campo.
        schema: z.object(
            Object.fromEntries([
                ...campos.map(({ chave, campo }) => [
                    chave,
                    schemaDoCampo(campo),
                ]),
                ...ocorrencias.map(({ chave }) => [
                    chave,
                    nomeOcorrenciaSchema,
                ]),
            ]),
        ) as unknown as z.ZodType<ValoresFicha, ValoresFicha>,
        defaultValues: Object.fromEntries([
            ...campos.map(({ chave, campo }) => [chave, valorInicial(campo)]),
            ...ocorrencias.map(({ chave, agrupamento, ordem }) => [
                chave,
                nomePadrao(agrupamento, ordem),
            ]),
        ]) as ValoresFicha,
    };
}

const DIGITADO = /^(\d+)(?:[.,](\d{1,4}))?$/;
const NORMALIZADO = /^(\d+)\.(\d{4})$/;

/**
 * A nota digitada no formato do envio: `"8,5"` → `"8.5000"`. O que não é um
 * decimal de até 4 casas fica como foi digitado — só a avaliação atual o
 * guarda, e o envio o recusa.
 */
function valorNumericoDoDigitado(digitado: string) {
    const casou = DIGITADO.exec(digitado);
    if (!casou) return digitado;
    const [, inteiro = "", fracao = ""] = casou;
    return `${inteiro.replace(/^0+(?=\d)/, "")}.${fracao.padEnd(4, "0")}`;
}

/** O caminho de volta: `"8.5000"` → `"8,5"`, `"10.0000"` → `"10"`. */
function digitadoDoValorNumerico(valor: string) {
    const casou = NORMALIZADO.exec(valor);
    if (!casou) return valor;
    const [, inteiro = "", fracao = ""] = casou;
    const casas = fracao.replace(/0+$/, "");
    return casas ? `${inteiro},${casas}` : inteiro;
}

/** A resposta de um campo no payload, ou nula quando está em branco. */
function respostaDoValor(
    posicao: PosicaoFicha,
    valor: ValorCampo | undefined,
): RespostaEnvio | null {
    const campoFichaId = posicao.id;
    switch (posicao.campo.tipo) {
        case "NUMERICO": {
            const texto = typeof valor === "string" ? valor.trim() : "";
            if (!texto) return null;
            return {
                campoFichaId,
                valorNumerico: valorNumericoDoDigitado(texto),
            };
        }
        case "ALTERNATIVA_UNICA":
            return typeof valor === "number"
                ? { campoFichaId, alternativaId: valor }
                : null;
        case "ALTERNATIVA_MULTIPLA":
            return Array.isArray(valor) && valor.length
                ? { campoFichaId, alternativaIds: valor }
                : null;
        case "DESCRITIVO":
        case "OBSERVACAO":
            return typeof valor === "string" && valor.trim()
                ? { campoFichaId, valorTexto: valor }
                : null;
    }
}

/** O valor de um campo no formulário, a partir da resposta guardada. */
function valorDaResposta(campo: CampoFicha, resposta: RespostaEnvio) {
    switch (campo.tipo) {
        case "NUMERICO":
            return "valorNumerico" in resposta
                ? digitadoDoValorNumerico(resposta.valorNumerico)
                : undefined;
        case "ALTERNATIVA_UNICA":
            return "alternativaId" in resposta
                ? resposta.alternativaId
                : undefined;
        case "ALTERNATIVA_MULTIPLA":
            return "alternativaIds" in resposta
                ? resposta.alternativaIds
                : undefined;
        case "DESCRITIVO":
        case "OBSERVACAO":
            return "valorTexto" in resposta ? resposta.valorTexto : undefined;
    }
}

function respostasDasPosicoes(
    posicoes: PosicaoFicha[],
    valorDe: (posicao: PosicaoFicha) => ValorCampo | undefined,
) {
    return posicoes.flatMap((posicao) => {
        const resposta = respostaDoValor(posicao, valorDe(posicao));
        return resposta ? [resposta] : [];
    });
}

/**
 * O payload de envio a partir do formulário, na ordem da ficha: o que o app
 * guarda na avaliação atual e na fila. Cada agrupamento aparece com todas as
 * ocorrências, mesmo as sem resposta; nome apagado volta ao padrão.
 */
export function payloadDoFormulario(
    modelo: ModeloFichaDetalhe,
    valores: ValoresFicha,
): EnvioAvaliacao {
    const gerais = [...modelo.camposGerais].sort((a, b) => a.ordem - b.ordem);

    return {
        modeloFichaAvaliativaId: modelo.id,
        respostasGerais: respostasDasPosicoes(
            gerais,
            (posicao) => valores[chaveGeral(posicao)],
        ),
        agrupamentos: ocorrenciasComChave(modelo).map(
            ({ chave, agrupamento, ordem }) => {
                const nome = valores[chave];
                return {
                    agrupamentoId: agrupamento.id,
                    ordem,
                    nome:
                        (typeof nome === "string" && nome.trim()) ||
                        nomePadrao(agrupamento, ordem),
                    respostas: respostasDasPosicoes(
                        camposDoAgrupamento(agrupamento),
                        (posicao) =>
                            valores[
                                chaveDaOcorrencia(agrupamento, ordem, posicao)
                            ],
                    ),
                };
            },
        ),
    };
}

/**
 * O formulário a partir do payload guardado: o que não está nele fica com o
 * valor inicial. Resposta de uma posição que o modelo não tem, ou com o
 * conteúdo de outro tipo, é ignorada — com a versão do modelo guardada junto
 * (TE-74), isso não deve acontecer.
 */
export function formularioDoPayload(
    modelo: ModeloFichaDetalhe,
    payload: EnvioAvaliacao,
): ValoresFicha {
    const valores = { ...montarFormularioFicha(modelo).defaultValues };

    const preencher = (
        posicoes: PosicaoFicha[],
        respostas: RespostaEnvio[],
        chaveDe: (posicao: PosicaoFicha) => string,
    ) => {
        for (const resposta of respostas) {
            const posicao = posicoes.find(
                ({ id }) => id === resposta.campoFichaId,
            );
            if (!posicao) continue;
            const valor = valorDaResposta(posicao.campo, resposta);
            if (valor !== undefined) valores[chaveDe(posicao)] = valor;
        }
    };

    preencher(modelo.camposGerais, payload.respostasGerais, chaveGeral);

    for (const ocorrencia of payload.agrupamentos) {
        const agrupamento = modelo.agrupamentos.find(
            ({ id }) => id === ocorrencia.agrupamentoId,
        );
        if (
            !agrupamento ||
            ocorrencia.ordem < 1 ||
            ocorrencia.ordem > agrupamento.quantidade
        )
            continue;
        if (ocorrencia.nome.trim())
            valores[chaveNome(agrupamento, ocorrencia.ordem)] = ocorrencia.nome;
        preencher(agrupamento.campos, ocorrencia.respostas, (posicao) =>
            chaveDaOcorrencia(agrupamento, ocorrencia.ordem, posicao),
        );
    }

    return valores;
}
