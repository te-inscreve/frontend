import { describe, expect, it } from "vitest";

import type { RespostaNota } from "./nota";
import { calcularNota, calcularSubtotal } from "./nota";

const soma = (valor: string): RespostaNota => ({ modificador: "SOMA", valor });
const desconta = (valor: string): RespostaNota => ({
    modificador: "DESCONTA",
    valor,
});

describe("calcularNota", () => {
    // Os mesmos casos de `test_calculo_nota_service.py` no backend: se um
    // lado mudar a fórmula, o outro quebra aqui.
    it.each([
        { gerais: [soma("3"), desconta("5")], unidades: [], nota: "-2.0000" },
        { gerais: [soma("1")], unidades: [], nota: "1.0000" },
        { gerais: [], unidades: [[soma("1")], [], []], nota: "0.3333" },
        { gerais: [], unidades: [[desconta("1")], [], []], nota: "-0.3334" },
        { gerais: [soma("9")], unidades: [[soma("8")]], nota: "10.0000" },
        {
            gerais: [soma("1")],
            unidades: [[soma("8"), desconta("1")], [soma("4")], [soma("9")]],
            nota: "7.6666",
        },
    ])("igual ao backend: $nota", ({ gerais, unidades, nota }) => {
        expect(calcularNota({ gerais, unidades })).toBe(nota);
    });

    it("reproduz o exemplo de envio da API", () => {
        // (((8 − 0) + (9 − 1)) / 2) + 1
        const nota = calcularNota({
            gerais: [soma("1")],
            unidades: [
                [soma("8"), desconta("0")],
                [soma("9"), desconta("1")],
            ],
        });
        expect(nota).toBe("9.0000");
    });

    it("tira a média de todas as unidades, de todos os agrupamentos", () => {
        // Agrupamento A com 1 ocorrência (10) e B com 3 (2, 2, 2): a média
        // por ocorrência é 4; a média das médias seria 6.
        const nota = calcularNota({
            gerais: [],
            unidades: [[soma("10")], [soma("2")], [soma("2")], [soma("2")]],
        });
        expect(nota).toBe("4.0000");
    });

    it("aceita vírgula ou ponto, como o formulário guarda", () => {
        const nota = calcularNota({
            gerais: [soma("0,75"), soma("1.25"), soma("8.0000")],
            unidades: [],
        });
        expect(nota).toBe("10.0000");
    });

    it("ignora resposta vazia ou inválida, para a prévia andar", () => {
        const nota = calcularNota({
            gerais: [
                soma(""),
                soma("  "),
                soma("abc"),
                soma("1,23456"),
                soma("-3"),
                { modificador: "SOMA", valor: null },
                soma(" 2,5 "),
            ],
            unidades: [],
        });
        expect(nota).toBe("2.5000");
    });

    it("aplica o teto antes de arredondar, e não impõe piso", () => {
        expect(
            calcularNota({
                gerais: [soma("10"), soma("0,0001")],
                unidades: [],
            }),
        ).toBe("10.0000");
        expect(
            calcularNota({ gerais: [desconta("12,3456")], unidades: [] }),
        ).toBe("-12.3456");
    });

    it("dá zero sem respostas", () => {
        expect(calcularNota({ gerais: [], unidades: [] })).toBe("0.0000");
        expect(calcularNota({ gerais: [], unidades: [[], []] })).toBe("0.0000");
    });

    it("arredonda dízima para baixo nos dois sinais", () => {
        const unidades = [[soma("2")], [], []];
        expect(calcularNota({ gerais: [], unidades })).toBe("0.6666");
        expect(
            calcularNota({ gerais: [], unidades: [[desconta("2")], [], []] }),
        ).toBe("-0.6667");
    });

    it("não perde precisão no limite de decimal(12,4)", () => {
        const nota = calcularNota({
            gerais: [desconta("99999999,9999"), soma("99999999,9998")],
            unidades: [],
        });
        expect(nota).toBe("-0.0001");
    });
});

describe("calcularSubtotal", () => {
    it("soma e desconta sem teto nem média", () => {
        expect(
            calcularSubtotal([soma("8"), soma("4,5"), desconta("0,25")]),
        ).toBe("12.2500");
    });

    it("ignora vazio e inválido, e dá zero sem respostas", () => {
        expect(calcularSubtotal([soma(""), soma("x"), soma("1,5")])).toBe(
            "1.5000",
        );
        expect(calcularSubtotal([])).toBe("0.0000");
    });

    it("fica negativo quando o desconto passa da soma", () => {
        expect(calcularSubtotal([soma("1"), desconta("2,5")])).toBe("-1.5000");
    });
});
