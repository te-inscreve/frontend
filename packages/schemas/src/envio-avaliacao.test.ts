import { describe, expect, it } from "vitest";

import type { EnvioAvaliacao } from "./envio-avaliacao";
import type { CampoFicha, ModeloFichaDetalhe } from "./ficha-avaliativa";
import { envioAvaliacaoSchema } from "./envio-avaliacao";
import { modeloFichaDetalheSchema } from "./ficha-avaliativa";
import {
    chaveDaOcorrencia,
    chaveGeral,
    chaveNome,
    formularioDoPayload,
    montarFormularioFicha,
    payloadDoFormulario,
} from "./formulario-ficha";
import { calcularNota } from "./nota";

const campo = (
    id: number,
    nome: string,
    mudancas: Partial<CampoFicha>,
): CampoFicha => ({
    id,
    global: true,
    nome,
    descricao: "",
    tipo: "OBSERVACAO",
    obrigatorio: false,
    ...mudancas,
});

const desconto = (id: number, nome: string, valorMaximo: string) =>
    campo(id, nome, {
        tipo: "NUMERICO",
        valorMaximo,
        modificadorNota: "DESCONTA",
    });

const nota = (id: number, nome: string, valorMaximo: string) =>
    campo(id, nome, {
        tipo: "NUMERICO",
        obrigatorio: true,
        valorMaximo,
        modificadorNota: "SOMA",
    });

/**
 * O modelo 11003, "Danças Tradicionais Pré-Mirim", como as fixtures do
 * backend o definem (`modelos-globais.json`): seis campos gerais de todos os
 * tipos e o agrupamento "Danças", com quatro ocorrências.
 */
const modelo11003: ModeloFichaDetalhe = modeloFichaDetalheSchema.parse({
    id: 11003,
    codigoFamilia: "8a3c1f0e-5b7d-4e2a-9c61-0d4f2b7e9a13",
    versao: 1,
    nome: "Danças Tradicionais Pré-Mirim",
    original: true,
    global: true,
    editavel: false,
    versoes: [{ id: 11003, versao: 1 }],
    camposGerais: [
        {
            id: 15013,
            ordem: 2,
            campo: desconto(12023, "Desconto Indumentária", "0.5000"),
        },
        {
            id: 15014,
            ordem: 3,
            campo: desconto(12024, "Desconto Tempo", "9.0000"),
        },
        {
            id: 15015,
            ordem: 4,
            campo: campo(12025, "Observações sobre Indumentária", {}),
        },
        {
            id: 15016,
            ordem: 5,
            campo: campo(12026, "Qualidade Vocal/Instrumental", {
                tipo: "ALTERNATIVA_UNICA",
                alternativas: [
                    { id: 13019, nome: "Muito Bom", ordem: 1 },
                    { id: 13020, nome: "Bom", ordem: 2 },
                    { id: 13021, nome: "Regular", ordem: 3 },
                    { id: 13022, nome: "Deficiente", ordem: 4 },
                ],
            }),
        },
        {
            id: 15017,
            ordem: 6,
            campo: campo(12027, "Observação Musical", {
                tipo: "ALTERNATIVA_MULTIPLA",
                alternativas: [
                    { id: 13023, nome: "Gaita", ordem: 1 },
                    { id: 13024, nome: "Violão", ordem: 2 },
                    { id: 13025, nome: "Violino", ordem: 3 },
                    { id: 13026, nome: "Pandeiro", ordem: 4 },
                    { id: 13027, nome: "Vozes", ordem: 5 },
                ],
            }),
        },
        {
            id: 15018,
            ordem: 7,
            campo: campo(12028, "Tempo Oficial da Apresentação", {
                tipo: "DESCRITIVO",
            }),
        },
    ],
    agrupamentos: [
        {
            id: 14003,
            nome: "Danças",
            quantidade: 4,
            ordem: 1,
            campos: [
                {
                    id: 16011,
                    ordem: 1,
                    campo: nota(12029, "Coreografia", "2.0000"),
                },
                {
                    id: 16012,
                    ordem: 2,
                    campo: nota(12030, "Interpretação", "4.0000"),
                },
                {
                    id: 16013,
                    ordem: 3,
                    campo: nota(12031, "Harmonia", "2.0000"),
                },
                { id: 16014, ordem: 4, campo: nota(12032, "Música", "2.0000") },
                {
                    id: 16015,
                    ordem: 5,
                    campo: campo(12033, "Observações da Dança", {}),
                },
            ],
        },
    ],
});

const danca = (
    ordem: number,
    nome: string,
    notas: [string, string, string, string],
    observacao: string,
) => ({
    agrupamentoId: 14003,
    ordem,
    nome,
    respostas: [
        ...notas.map((valorNumerico, i) => ({
            campoFichaId: 16011 + i,
            valorNumerico,
        })),
        { campoFichaId: 16015, valorTexto: observacao },
    ],
});

/**
 * O exemplo de envio do 11003 escrito pelo dono do produto, com a única
 * (15016) em `alternativaId`, como o backend exige.
 */
const envio11003: EnvioAvaliacao = {
    modeloFichaAvaliativaId: 11003,
    respostasGerais: [
        { campoFichaId: 15013, valorNumerico: "0.1000" },
        { campoFichaId: 15014, valorNumerico: "0.2000" },
        {
            campoFichaId: 15015,
            valorTexto:
                "Indumentária adequada à faixa etária e à proposta das danças.",
        },
        { campoFichaId: 15016, alternativaId: 13020 },
        { campoFichaId: 15017, alternativaIds: [13023, 13024, 13027] },
        { campoFichaId: 15018, valorTexto: "4 min 38 s" },
    ],
    agrupamentos: [
        danca(
            1,
            "Pezinho",
            ["1.8000", "3.6000", "1.7000", "1.8000"],
            "Boa entrada.",
        ),
        danca(
            2,
            "Maçanico",
            ["1.9000", "3.7000", "1.8000", "1.9000"],
            "Sincronia.",
        ),
        danca(
            3,
            "Balaio",
            ["1.7000", "3.5000", "1.8000", "1.7000"],
            "Energia.",
        ),
        danca(
            4,
            "Chote Carreirinha",
            ["1.8000", "3.8000", "1.9000", "1.8000"],
            "Coesão.",
        ),
    ],
};

/** Busca no modelo, falhando o teste quando não acha. */
function achar<T>(itens: T[], cabe: (item: T) => boolean): T {
    const achado = itens.find(cabe);
    if (achado === undefined) throw new Error("Fora do modelo 11003.");
    return achado;
}

const dancas = achar(modelo11003.agrupamentos, ({ id }) => id === 14003);
const posicao = (id: number) =>
    achar(
        [...modelo11003.camposGerais, ...dancas.campos],
        (item) => item.id === id,
    );

describe("envioAvaliacaoSchema", () => {
    it("aceita o exemplo do 11003", () => {
        expect(envioAvaliacaoSchema.safeParse(envio11003).success).toBe(true);
    });

    it("checa só a forma: o tipo de cada campo está no modelo", () => {
        // O tipo do campo está no modelo, não no payload: o schema só checa a
        // forma, e quem decide entre `alternativaId` e `alternativaIds` é o
        // `payloadDoFormulario`, pelo tipo.
        const resposta = { campoFichaId: 15016, alternativaIds: [13020] };
        expect(
            envioAvaliacaoSchema.safeParse({
                ...envio11003,
                respostasGerais: [resposta],
            }).success,
        ).toBe(true);
    });

    it.each([
        ["numérico sem as 4 casas", { campoFichaId: 1, valorNumerico: "8,5" }],
        ["texto só com espaços", { campoFichaId: 1, valorTexto: "  " }],
        ["múltipla vazia", { campoFichaId: 1, alternativaIds: [] }],
        [
            "dois conteúdos",
            { campoFichaId: 1, valorTexto: "a", alternativaId: 2 },
        ],
        ["chave desconhecida", { campoFichaId: 1, valorTexto: "a", extra: 1 }],
    ])("recusa %s", (_, resposta) => {
        expect(
            envioAvaliacaoSchema.safeParse({
                ...envio11003,
                respostasGerais: [resposta],
            }).success,
        ).toBe(false);
    });

    it("recusa ocorrência sem nome", () => {
        const [primeira, ...resto] = envio11003.agrupamentos;
        expect(
            envioAvaliacaoSchema.safeParse({
                ...envio11003,
                agrupamentos: [{ ...primeira, nome: "   " }, ...resto],
            }).success,
        ).toBe(false);
    });
});

describe("formularioDoPayload e payloadDoFormulario", () => {
    it("vão e voltam sem perder nada", () => {
        const valores = formularioDoPayload(modelo11003, envio11003);
        expect(payloadDoFormulario(modelo11003, valores)).toEqual(envio11003);
    });

    it("põem cada resposta na chave e no formato do formulário", () => {
        const valores = formularioDoPayload(modelo11003, envio11003);
        expect(valores[chaveGeral(posicao(15013))]).toBe("0,1");
        expect(valores[chaveGeral(posicao(15016))]).toBe(13020);
        expect(valores[chaveGeral(posicao(15017))]).toEqual([
            13023, 13024, 13027,
        ]);
        expect(valores[chaveGeral(posicao(15018))]).toBe("4 min 38 s");
        expect(valores[chaveNome(dancas, 4)]).toBe("Chote Carreirinha");
        expect(valores[chaveDaOcorrencia(dancas, 2, posicao(16012))]).toBe(
            "3,7",
        );
    });

    it("dão a mesma nota que o payload", () => {
        // Média das 4 danças (8.9 + 9.3 + 8.7 + 9.3 = 36.2 / 4 = 9.05),
        // menos os descontos gerais (0.1 + 0.2).
        const respostas = (lista: EnvioAvaliacao["respostasGerais"]) =>
            lista.flatMap((resposta) => {
                if (!("valorNumerico" in resposta)) return [];
                const alvo = posicao(resposta.campoFichaId).campo;
                return [
                    {
                        modificador: alvo.modificadorNota ?? "SOMA",
                        valor: resposta.valorNumerico,
                    },
                ];
            });
        expect(
            calcularNota({
                gerais: respostas(envio11003.respostasGerais),
                unidades: envio11003.agrupamentos.map((ocorrencia) =>
                    respostas(ocorrencia.respostas),
                ),
            }),
        ).toBe("8.7500");
    });

    it("formulário em branco vira todas as ocorrências, sem respostas, com o nome padrão", () => {
        const { defaultValues } = montarFormularioFicha(modelo11003);
        expect(payloadDoFormulario(modelo11003, defaultValues)).toEqual({
            modeloFichaAvaliativaId: 11003,
            respostasGerais: [],
            agrupamentos: [1, 2, 3, 4].map((ordem) => ({
                agrupamentoId: 14003,
                ordem,
                nome: `Danças ${ordem}`,
                respostas: [],
            })),
        });
    });

    it("deixam de fora o que está em branco", () => {
        const valores = {
            ...montarFormularioFicha(modelo11003).defaultValues,
            [chaveGeral(posicao(15013))]: "  ",
            [chaveGeral(posicao(15015))]: "   ",
            [chaveGeral(posicao(15016))]: null,
            [chaveGeral(posicao(15017))]: [],
            [chaveGeral(posicao(15018))]: "",
        };
        expect(
            payloadDoFormulario(modelo11003, valores).respostasGerais,
        ).toEqual([]);
    });

    it("normalizam a nota digitada e guardam como está a que não normaliza", () => {
        const valores = {
            ...montarFormularioFicha(modelo11003).defaultValues,
            [chaveGeral(posicao(15013))]: "0,5",
            [chaveGeral(posicao(15014))]: "007",
            [chaveDaOcorrencia(dancas, 1, posicao(16011))]: "1,23456",
        };
        const payload = payloadDoFormulario(modelo11003, valores);
        expect(payload.respostasGerais).toEqual([
            { campoFichaId: 15013, valorNumerico: "0.5000" },
            { campoFichaId: 15014, valorNumerico: "7.0000" },
        ]);
        expect(payload.agrupamentos[0]?.respostas).toEqual([
            { campoFichaId: 16011, valorNumerico: "1,23456" },
        ]);
        // A avaliação atual reabre com o que foi digitado, e o envio o recusa.
        expect(
            formularioDoPayload(modelo11003, payload)[
                chaveDaOcorrencia(dancas, 1, posicao(16011))
            ],
        ).toBe("1,23456");
        expect(envioAvaliacaoSchema.safeParse(payload).success).toBe(false);
    });

    it("devolvem o nome padrão ao nome apagado e tiram os espaços das pontas", () => {
        const valores = {
            ...montarFormularioFicha(modelo11003).defaultValues,
            [chaveNome(dancas, 1)]: "   ",
            [chaveNome(dancas, 2)]: "  Maçanico ",
        };
        const nomes = payloadDoFormulario(
            modelo11003,
            valores,
        ).agrupamentos.map(({ nome }) => nome);
        expect(nomes).toEqual(["Danças 1", "Maçanico", "Danças 3", "Danças 4"]);
    });

    it("ignoram posição, agrupamento e ordem que o modelo não tem", () => {
        const valores = formularioDoPayload(modelo11003, {
            modeloFichaAvaliativaId: 11003,
            respostasGerais: [
                { campoFichaId: 99999, valorTexto: "fora" },
                // Conteúdo de outro tipo: a única não aceita lista.
                { campoFichaId: 15016, alternativaIds: [13020] },
            ],
            agrupamentos: [
                { agrupamentoId: 99999, ordem: 1, nome: "X", respostas: [] },
                { agrupamentoId: 14003, ordem: 9, nome: "Y", respostas: [] },
            ],
        });
        expect(valores).toEqual(
            montarFormularioFicha(modelo11003).defaultValues,
        );
    });
});

describe("montarFormularioFicha e o nome da ocorrência", () => {
    const { schema, defaultValues } = montarFormularioFicha(modelo11003);
    const chave = chaveNome(dancas, 1);

    it("nasce com o nome padrão", () => {
        expect(defaultValues[chave]).toBe("Danças 1");
    });

    it("cobra nome não vazio e de até 255 caracteres", () => {
        const erro = (nome: string) =>
            schema
                .safeParse({ ...defaultValues, [chave]: nome })
                .error?.issues.find((issue) => issue.path[0] === chave)
                ?.message;
        expect(erro("Pezinho")).toBeUndefined();
        expect(erro("  ")).toBe("Informe o nome.");
        expect(erro("a".repeat(256))).toBe("Use até 255 caracteres.");
    });
});
