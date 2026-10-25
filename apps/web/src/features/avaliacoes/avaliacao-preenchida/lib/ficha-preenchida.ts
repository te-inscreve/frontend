import type {
    AvaliacaoDetalhe,
    CampoFicha,
    ModeloFichaDetalhe,
    PosicaoFicha,
    RespostaAvaliacao,
} from "@te-inscreve/schemas";
import {
    calcularSubtotal,
    camposDoAgrupamento,
    nomePadrao,
} from "@te-inscreve/schemas";

import type { CampoExibido } from "../../editor-modelo-ficha/lib/campo-exibido";
import { exibirCampoGlobal } from "../../editor-modelo-ficha/lib/campo-exibido";

/** O que a folha escreve no lugar da resposta, já pronto para ler. */
export type ValorExibido =
    | { tipo: "branco" }
    /** `"8.5000"` → `"8,5"`. */
    | { tipo: "numerico"; valor: string }
    | { tipo: "texto"; texto: string }
    | { tipo: "alternativas"; nomes: string[] };

export interface CampoPreenchido {
    chave: number;
    campo: CampoExibido;
    valor: ValorExibido;
}

export interface OcorrenciaPreenchida {
    ordem: number;
    nome: string;
    /** Um por campo do agrupamento, na mesma ordem de `campos`. */
    valores: ValorExibido[];
    /**
     * Soma menos desconto das notas da ocorrência, sem teto, já pronto para
     * ler (`"7,5"`); nulo quando nenhuma nota dela foi dada.
     */
    total: string | null;
}

export interface AgrupamentoPreenchido {
    chave: number;
    nome: string;
    campos: { chave: number; campo: CampoExibido }[];
    ocorrencias: OcorrenciaPreenchida[];
    /** O total só existe onde há nota a somar: algum campo numérico. */
    temTotal: boolean;
}

export type ItemPreenchido =
    | ({ tipo: "campo" } & CampoPreenchido)
    | ({ tipo: "agrupamento" } & AgrupamentoPreenchido);

const BRANCO: ValorExibido = { tipo: "branco" };

/**
 * A ficha com as respostas no lugar: o detalhe só traz ids e valores, e é o
 * modelo que dá a ordem, os rótulos e os nomes das alternativas.
 *
 * O `campoFichaId` é o `id` da posição — a do topo nas respostas gerais, a do
 * agrupamento dentro de uma ocorrência. Posição sem resposta é campo deixado
 * em branco. Cada agrupamento sai com todas as `quantidade` ocorrências, na
 * ordem, mesmo a que não veio no detalhe.
 *
 * Campos gerais e agrupamentos numeram juntos no topo; no empate, o campo
 * geral vem antes, como em `itensDoTopo`.
 */
export function fichaPreenchida(
    modelo: ModeloFichaDetalhe,
    avaliacao: AvaliacaoDetalhe,
): ItemPreenchido[] {
    const campos = modelo.camposGerais.map((posicao) => ({
        ordem: posicao.ordem,
        empate: 0,
        item: {
            tipo: "campo",
            chave: posicao.id,
            campo: exibirCampoGlobal(posicao.campo),
            valor: valorDaPosicao(posicao, avaliacao.respostasGerais),
        } satisfies ItemPreenchido,
    }));

    const agrupamentos = modelo.agrupamentos.map((agrupamento) => {
        const posicoes = camposDoAgrupamento(agrupamento);
        const ocorrencias = Array.from(
            { length: agrupamento.quantidade },
            (_, indice) => {
                const ordem = indice + 1;
                const enviada = avaliacao.agrupamentos.find(
                    (ocorrencia) =>
                        ocorrencia.agrupamentoId === agrupamento.id &&
                        ocorrencia.ordem === ordem,
                );
                return {
                    ordem,
                    nome: enviada?.nome ?? nomePadrao(agrupamento, ordem),
                    valores: posicoes.map((posicao) =>
                        valorDaPosicao(posicao, enviada?.respostas ?? []),
                    ),
                    total: totalDaOcorrencia(
                        posicoes,
                        enviada?.respostas ?? [],
                    ),
                };
            },
        );

        return {
            ordem: agrupamento.ordem,
            empate: 1,
            item: {
                tipo: "agrupamento",
                chave: agrupamento.id,
                nome: agrupamento.nome,
                campos: posicoes.map((posicao) => ({
                    chave: posicao.id,
                    campo: exibirCampoGlobal(posicao.campo),
                })),
                ocorrencias,
                temTotal: posicoes.some(
                    ({ campo }) => campo.tipo === "NUMERICO",
                ),
            } satisfies ItemPreenchido,
        };
    });

    return [...campos, ...agrupamentos]
        .sort((a, b) => a.ordem - b.ordem || a.empate - b.empate)
        .map(({ item }) => item);
}

/**
 * O total da ocorrência pela mesma conta do app (`calcularSubtotal`, a
 * fórmula do backend): soma dos SOMA menos a dos DESCONTA, sem teto. É o
 * subtotal da unidade antes da média — a nota da avaliação é a média deles,
 * mais os campos gerais.
 */
function totalDaOcorrencia(
    posicoes: PosicaoFicha[],
    respostas: RespostaAvaliacao[],
) {
    const notas = posicoes.flatMap(({ id, campo }) => {
        const resposta = respostas.find(
            ({ campoFichaId }) => campoFichaId === id,
        );
        if (
            !campo.modificadorNota ||
            !resposta ||
            !("valorNumerico" in resposta)
        )
            return [];
        return [
            {
                modificador: campo.modificadorNota,
                valor: resposta.valorNumerico,
            },
        ];
    });
    return notas.length > 0 ? formatarNumero(calcularSubtotal(notas)) : null;
}

function valorDaPosicao(
    posicao: PosicaoFicha,
    respostas: RespostaAvaliacao[],
): ValorExibido {
    const resposta = respostas.find(
        ({ campoFichaId }) => campoFichaId === posicao.id,
    );
    return resposta ? valorDaResposta(posicao.campo, resposta) : BRANCO;
}

/**
 * O conteúdo que o tipo do campo espera. Resposta com o conteúdo de outro
 * tipo não deveria existir — a avaliação aponta a versão exata do modelo —, e
 * sai como em branco em vez de inventar uma leitura.
 */
function valorDaResposta(
    campo: CampoFicha,
    resposta: RespostaAvaliacao,
): ValorExibido {
    switch (campo.tipo) {
        case "NUMERICO":
            return "valorNumerico" in resposta
                ? {
                      tipo: "numerico",
                      valor: formatarNumero(resposta.valorNumerico),
                  }
                : BRANCO;
        case "DESCRITIVO":
        case "OBSERVACAO":
            return "valorTexto" in resposta
                ? { tipo: "texto", texto: resposta.valorTexto }
                : BRANCO;
        case "ALTERNATIVA_UNICA":
            return "alternativaId" in resposta
                ? alternativas(campo, [resposta.alternativaId])
                : BRANCO;
        case "ALTERNATIVA_MULTIPLA":
            return "alternativaIds" in resposta
                ? alternativas(campo, resposta.alternativaIds)
                : BRANCO;
    }
}

function alternativas(campo: CampoFicha, ids: number[]): ValorExibido {
    const nomes = ids.flatMap((id) => {
        const alternativa = campo.alternativas?.find(
            (candidata) => candidata.id === id,
        );
        return alternativa ? [alternativa.nome] : [];
    });
    return nomes.length > 0 ? { tipo: "alternativas", nomes } : BRANCO;
}

/**
 * `"8.5000"` → `"8,5"`. Só para ler: a conversão para `number` não perde nada
 * visível num `decimal(12,4)`.
 */
function formatarNumero(valor: string) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return valor;
    return numero.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}
