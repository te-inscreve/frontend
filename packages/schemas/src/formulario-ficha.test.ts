import { describe, expect, it } from "vitest";

import type { CampoFicha, ModeloFichaDetalhe } from "./ficha-avaliativa";
import { modeloFichaDetalheSchema } from "./ficha-avaliativa";
import {
    camposComChave,
    itensDoTopo,
    montarFormularioFicha,
    schemaDoCampo,
} from "./formulario-ficha";

/** Um campo com o básico; cada teste muda só o que importa a ele. */
const campo = (mudancas: Partial<CampoFicha>): CampoFicha => ({
    id: 1,
    global: false,
    nome: "Campo",
    descricao: "",
    tipo: "DESCRITIVO",
    obrigatorio: false,
    ...mudancas,
});

const numerico = (mudancas: Partial<CampoFicha> = {}) =>
    campo({
        tipo: "NUMERICO",
        obrigatorio: true,
        valorMaximo: "10.0000",
        modificadorNota: "SOMA",
        ...mudancas,
    });

const alternativas = [
    { id: 801, nome: "Figurino", ordem: 1 },
    { id: 802, nome: "Coreografia", ordem: 2 },
];

/** As mensagens de erro, ou nenhuma quando o valor passa. */
function erros(alvo: CampoFicha, valor: unknown) {
    const resultado = schemaDoCampo(alvo).safeParse(valor);
    return resultado.success
        ? []
        : resultado.error.issues.map((issue) => issue.message);
}

/**
 * Os casos do modelo 11006 (`docs/planos/app-avaliador-mobile.md`): campos
 * gerais com `ordem` 1–4, agrupamentos com `ordem` 1–2 — empatando com os
 * gerais, de antes da ordem única no topo —, dois agrupamentos com o mesmo
 * nome e um `valorMaximo: null`. Os campos seguem o formato de
 * `docs/planos/exemplo-frontend-envio-avaliacao.md`.
 */
const modelo11006: ModeloFichaDetalhe = modeloFichaDetalheSchema.parse({
    id: 11006,
    codigoFamilia: "2cfb95d4-7c58-4f8c-a834-73a791e1980e",
    versao: 1,
    nome: "Ficha de danças",
    original: false,
    global: false,
    editavel: false,
    // Fora de ordem de propósito: quem ordena é o builder.
    camposGerais: [
        {
            id: 204,
            ordem: 4,
            campo: numerico({
                id: 706,
                nome: "Penalidade de tempo",
                obrigatorio: false,
                valorMaximo: null,
                modificadorNota: "DESCONTA",
            }),
        },
        {
            id: 201,
            ordem: 1,
            campo: numerico({ id: 12, nome: "Pontuação geral" }),
        },
        {
            id: 202,
            ordem: 2,
            campo: campo({ id: 701, tipo: "OBSERVACAO" }),
        },
        {
            id: 203,
            ordem: 3,
            campo: campo({
                id: 705,
                tipo: "ALTERNATIVA_UNICA",
                obrigatorio: true,
                alternativas,
            }),
        },
    ],
    agrupamentos: [
        {
            id: 302,
            nome: "Danças",
            quantidade: 1,
            ordem: 2,
            campos: [
                {
                    id: 405,
                    ordem: 2,
                    campo: campo({ id: 708, obrigatorio: true }),
                },
                {
                    id: 404,
                    ordem: 1,
                    campo: numerico({ id: 707, valorMaximo: "5.0000" }),
                },
            ],
        },
        {
            id: 301,
            nome: "Danças",
            quantidade: 2,
            ordem: 1,
            campos: [
                { id: 401, ordem: 1, campo: numerico({ id: 702 }) },
                {
                    id: 403,
                    ordem: 3,
                    campo: campo({
                        id: 704,
                        tipo: "ALTERNATIVA_MULTIPLA",
                        alternativas,
                    }),
                },
                {
                    id: 402,
                    ordem: 2,
                    campo: numerico({
                        id: 703,
                        obrigatorio: false,
                        modificadorNota: "DESCONTA",
                    }),
                },
            ],
        },
    ],
    versoes: [{ id: 11006, versao: 1 }],
});

describe("schemaDoCampo", () => {
    describe("NUMERICO", () => {
        it.each(["0", "10", "8,5", "8.5", "0,0001", "9,9999", " 7 "])(
            "aceita %j até o teto",
            (valor) => {
                expect(erros(numerico(), valor)).toEqual([]);
            },
        );

        it("aceita até 4 casas e recusa a quinta", () => {
            expect(erros(numerico(), "1,2345")).toEqual([]);
            expect(erros(numerico(), "1,23456")).toEqual([
                "Use um número com até 4 casas decimais.",
            ]);
        });

        it.each(["-1", "abc", "1,", ",5", "1,2,3", "1e2"])(
            "recusa %j, que não é um decimal não negativo",
            (valor) => {
                expect(erros(numerico(), valor)).toEqual([
                    "Use um número com até 4 casas decimais.",
                ]);
            },
        );

        it("recusa acima do teto, com o teto em pt-BR", () => {
            expect(erros(numerico(), "10,0001")).toEqual(["O máximo é 10."]);
            expect(erros(numerico({ valorMaximo: "0.5000" }), "0,6")).toEqual([
                "O máximo é 0,5.",
            ]);
        });

        it("não tem teto quando o valorMaximo é nulo", () => {
            const semTeto = numerico({ valorMaximo: null });
            expect(erros(semTeto, "123456,7890")).toEqual([]);
        });

        it("cobra a nota só quando obrigatório", () => {
            expect(erros(numerico(), "")).toEqual(["Informe a nota."]);
            expect(erros(numerico(), "   ")).toEqual(["Informe a nota."]);
            expect(erros(numerico({ obrigatorio: false }), "")).toEqual([]);
        });
    });

    describe("ALTERNATIVA_UNICA", () => {
        const unica = (obrigatorio: boolean) =>
            campo({ tipo: "ALTERNATIVA_UNICA", obrigatorio, alternativas });

        it("aceita o id escolhido", () => {
            expect(erros(unica(true), 801)).toEqual([]);
        });

        it("cobra a escolha só quando obrigatório", () => {
            expect(erros(unica(true), null)).toEqual([
                "Escolha uma alternativa.",
            ]);
            expect(erros(unica(false), null)).toEqual([]);
        });

        it("não aceita uma lista", () => {
            expect(erros(unica(false), [801])).not.toEqual([]);
        });
    });

    describe("ALTERNATIVA_MULTIPLA", () => {
        const multipla = (obrigatorio: boolean) =>
            campo({ tipo: "ALTERNATIVA_MULTIPLA", obrigatorio, alternativas });

        it("aceita uma ou mais escolhas", () => {
            expect(erros(multipla(true), [801])).toEqual([]);
            expect(erros(multipla(true), [801, 802])).toEqual([]);
        });

        it("cobra ao menos uma só quando obrigatório", () => {
            expect(erros(multipla(true), [])).toEqual([
                "Escolha ao menos uma alternativa.",
            ]);
            expect(erros(multipla(false), [])).toEqual([]);
        });
    });

    describe.each(["DESCRITIVO", "OBSERVACAO"] as const)("%s", (tipo) => {
        it("aceita texto livre", () => {
            expect(
                erros(campo({ tipo, obrigatorio: true }), "Boa apresentação."),
            ).toEqual([]);
        });

        it("cobra texto só quando obrigatório, e espaço não conta", () => {
            expect(erros(campo({ tipo, obrigatorio: true }), "  ")).toEqual([
                "Preencha este campo.",
            ]);
            expect(erros(campo({ tipo, obrigatorio: false }), "")).toEqual([]);
        });
    });
});

describe("itensDoTopo", () => {
    it("ordena o 11006 pela ordem do topo, com o campo geral antes no empate", () => {
        const topo = itensDoTopo(modelo11006).map((item) =>
            item.tipo === "geral"
                ? `geral ${item.posicao.id}`
                : `${item.agrupamento.id} #${item.ordem}`,
        );

        expect(topo).toEqual([
            "geral 201", // ordem 1
            "301 #1", // ordem 1, empatado: depois do geral
            "301 #2",
            "geral 202", // ordem 2
            "302 #1", // ordem 2, empatado
            "geral 203",
            "geral 204",
        ]);
    });

    it("desdobra cada agrupamento em quantidade ocorrências", () => {
        const ocorrencias = itensDoTopo(modelo11006).filter(
            (item) => item.tipo === "ocorrencia",
        );
        expect(ocorrencias.map((item) => item.chave)).toEqual([
            "a301_1",
            "a301_2",
            "a302_1",
        ]);
    });
});

describe("montarFormularioFicha", () => {
    const { schema, defaultValues } = montarFormularioFicha(modelo11006);

    it("tem um campo por posição geral e por campo de cada ocorrência", () => {
        expect(camposComChave(modelo11006).map(({ chave }) => chave)).toEqual([
            "g201",
            "a301_1_401",
            "a301_1_402",
            "a301_1_403",
            "a301_2_401",
            "a301_2_402",
            "a301_2_403",
            "g202",
            "a302_1_404",
            "a302_1_405",
            "g203",
            "g204",
        ]);
    });

    it("começa vazio, com o valor inicial de cada tipo", () => {
        expect(defaultValues).toEqual({
            g201: "",
            a301_1_401: "",
            a301_1_402: "",
            a301_1_403: [],
            a301_2_401: "",
            a301_2_402: "",
            a301_2_403: [],
            g202: "",
            a302_1_404: "",
            a302_1_405: "",
            g203: null,
            g204: "",
        });
    });

    it("cobra só os obrigatórios na ficha vazia", () => {
        const resultado = schema.safeParse(defaultValues);
        expect(resultado.success).toBe(false);
        const campos = resultado.error?.issues.map((issue) => issue.path[0]);
        expect(campos).toEqual([
            "g201",
            "a301_1_401",
            "a301_2_401",
            "a302_1_404",
            "a302_1_405",
            "g203",
        ]);
    });

    it("aceita a ficha preenchida", () => {
        const resultado = schema.safeParse({
            ...defaultValues,
            g201: "1",
            a301_1_401: "8",
            a301_1_402: "0",
            a301_1_403: [801, 802],
            a301_2_401: "9,5",
            a301_2_402: "1",
            a302_1_404: "4,25",
            a302_1_405: "Passos precisos.",
            g203: 801,
            g204: "15",
        });
        expect(resultado.success).toBe(true);
    });

    it("usa o teto de cada campo", () => {
        const resultado = schema.safeParse({
            ...defaultValues,
            g201: "1",
            a301_1_401: "8",
            a301_2_401: "9",
            a302_1_404: "6", // teto 5
            a302_1_405: "Ok",
            g203: 801,
        });
        expect(resultado.error?.issues).toMatchObject([
            { path: ["a302_1_404"], message: "O máximo é 5." },
        ]);
    });
});
