import type { ModeloFichaDetalhe } from "@te-inscreve/schemas";
import { modeloFichaDetalheSchema } from "@te-inscreve/schemas";

/*
 * MOCK (TE-82): um modelo de ficha com os casos do 11006 — campos gerais com
 * `ordem` 1–4, agrupamentos com `ordem` 1–2 (empatando com os gerais), dois
 * agrupamentos com o mesmo nome e um `valorMaximo: null` — e os cinco tipos
 * de campo. Não é o 11006 real: a fonte da tela de teste está em aberto em
 * "De onde a tela de teste do formulário lê o modelo" (TE-100).
 *
 * Passa pelo `modeloFichaDetalheSchema` ao carregar o módulo, para o mock não
 * se afastar do que a API devolve.
 */
export const modeloFichaMock: ModeloFichaDetalhe =
    modeloFichaDetalheSchema.parse({
        id: 11006,
        codigoFamilia: "2cfb95d4-7c58-4f8c-a834-73a791e1980e",
        versao: 1,
        nome: "Ficha de danças (mock)",
        original: false,
        global: false,
        editavel: false,
        camposGerais: [
            {
                id: 201,
                ordem: 1,
                campo: {
                    id: 12,
                    global: true,
                    nome: "Pontuação geral",
                    descricao: "Acréscimo geral à nota",
                    tipo: "NUMERICO",
                    obrigatorio: true,
                    valorMaximo: "1.0000",
                    modificadorNota: "SOMA",
                },
            },
            {
                id: 202,
                ordem: 2,
                campo: {
                    id: 701,
                    global: false,
                    nome: "Observação geral",
                    descricao: "Comentários sobre a apresentação",
                    tipo: "OBSERVACAO",
                    obrigatorio: false,
                },
            },
            {
                id: 203,
                ordem: 3,
                campo: {
                    id: 705,
                    global: false,
                    nome: "Figurino",
                    descricao: "Adequação do figurino ao tema",
                    tipo: "ALTERNATIVA_UNICA",
                    obrigatorio: true,
                    alternativas: [
                        { id: 811, nome: "Adequado", ordem: 1 },
                        { id: 812, nome: "Parcialmente adequado", ordem: 2 },
                        { id: 813, nome: "Inadequado", ordem: 3 },
                    ],
                },
            },
            {
                id: 204,
                ordem: 4,
                campo: {
                    id: 706,
                    global: false,
                    nome: "Penalidade de tempo",
                    descricao: "Desconto por exceder o tempo",
                    tipo: "NUMERICO",
                    obrigatorio: false,
                    valorMaximo: null,
                    modificadorNota: "DESCONTA",
                },
            },
        ],
        agrupamentos: [
            {
                id: 301,
                nome: "Danças",
                quantidade: 2,
                ordem: 1,
                campos: [
                    {
                        id: 401,
                        ordem: 1,
                        campo: {
                            id: 702,
                            global: false,
                            nome: "Harmonia",
                            descricao: "Pontuação da dança",
                            tipo: "NUMERICO",
                            obrigatorio: true,
                            valorMaximo: "10.0000",
                            modificadorNota: "SOMA",
                        },
                    },
                    {
                        id: 402,
                        ordem: 2,
                        campo: {
                            id: 703,
                            global: false,
                            nome: "Desconto técnico",
                            descricao: "Pontos a descontar nesta dança",
                            tipo: "NUMERICO",
                            obrigatorio: false,
                            valorMaximo: "10.0000",
                            modificadorNota: "DESCONTA",
                        },
                    },
                    {
                        id: 403,
                        ordem: 3,
                        campo: {
                            id: 704,
                            global: false,
                            nome: "Destaques",
                            descricao: "Aspectos observados na dança",
                            tipo: "ALTERNATIVA_MULTIPLA",
                            obrigatorio: false,
                            alternativas: [
                                { id: 801, nome: "Figurino", ordem: 1 },
                                { id: 802, nome: "Coreografia", ordem: 2 },
                                { id: 803, nome: "Expressão", ordem: 3 },
                            ],
                        },
                    },
                ],
            },
            {
                id: 302,
                nome: "Danças",
                quantidade: 1,
                ordem: 2,
                campos: [
                    {
                        id: 404,
                        ordem: 1,
                        campo: {
                            id: 707,
                            global: false,
                            nome: "Execução",
                            descricao: "Precisão dos passos",
                            tipo: "NUMERICO",
                            obrigatorio: true,
                            valorMaximo: "5.0000",
                            modificadorNota: "SOMA",
                        },
                    },
                    {
                        id: 405,
                        ordem: 2,
                        campo: {
                            id: 708,
                            global: false,
                            nome: "Parecer técnico",
                            descricao: "Descreva a execução",
                            tipo: "DESCRITIVO",
                            obrigatorio: true,
                        },
                    },
                ],
            },
        ],
        versoes: [{ id: 11006, versao: 1 }],
    });

/**
 * MOCK (TE-82): uma ficha curta, para chegar à tela de sucesso sem preencher
 * a ficha toda — uma nota obrigatória e uma observação opcional. Com só os
 * campos gerais, a barra de abas não aparece.
 */
export const modeloFichaSimplesMock: ModeloFichaDetalhe =
    modeloFichaDetalheSchema.parse({
        id: 11007,
        codigoFamilia: "8a0d6f2e-5b1c-4e7a-9f3d-2c6b1a4e9d70",
        versao: 1,
        nome: "Ficha rápida (mock)",
        original: false,
        global: false,
        editavel: false,
        camposGerais: [
            {
                id: 211,
                ordem: 1,
                campo: {
                    id: 721,
                    global: false,
                    nome: "Nota da apresentação",
                    descricao: "Nota geral da apresentação",
                    tipo: "NUMERICO",
                    obrigatorio: true,
                    valorMaximo: "10.0000",
                    modificadorNota: "SOMA",
                },
            },
            {
                id: 212,
                ordem: 2,
                campo: {
                    id: 722,
                    global: false,
                    nome: "Observação",
                    descricao: "Comentários sobre a apresentação",
                    tipo: "OBSERVACAO",
                    obrigatorio: false,
                },
            },
        ],
        agrupamentos: [],
        versoes: [{ id: 11007, versao: 1 }],
    });

/**
 * MOCK (TE-82): a inscrição avaliada, para a tela de sucesso. A tela de teste
 * não vem de uma inscrição de verdade; quando vier, isto sai da inscrição.
 */
export const inscricaoAvaliadaMock = {
    concorrente: "Invernada Juvenil",
    entidade: "CTG Querência Amada",
    categoria: "Juvenil",
    modalidade: "Danças tradicionalistas",
    evento: "Rodeio de Flores",
    ordemApresentacao: 7,
};

export type InscricaoAvaliada = typeof inscricaoAvaliadaMock;
