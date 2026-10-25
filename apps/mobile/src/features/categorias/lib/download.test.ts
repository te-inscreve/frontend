/* eslint-disable @typescript-eslint/require-await -- as portas falsas são
 * assíncronas só para cumprir a interface. */
import { describe, expect, it, vi } from "vitest";

import type {
    InscricoesDaCategoria,
    ModeloFichaDetalhe,
} from "@te-inscreve/schemas";

import type { PlanoDownload, PortasDownload } from "./download";
import type { CategoriaPronta } from "./listar-categorias-prontas";
import type { AvaliacaoLocal } from "~/db/schema";
import { baixarCategorias } from "./download";

function categoria(id: number): CategoriaPronta {
    return {
        id,
        nome: `Categoria ${id}`,
        eventoId: 1,
        eventoNome: "Rodeio",
        modalidadeId: 2,
        modalidadeNome: "Chula",
        isGrupo: false,
        idadeMinima: 8,
        idadeMaxima: 12,
        countInscricoes: 1,
        maxInscricoes: null,
        dataApresentacao: null,
        situacao: { value: "pronta_avaliacao", label: "Pronta para avaliação" },
    };
}

const modelo = (id: number) =>
    ({ id, nome: `Modelo ${id}` }) as ModeloFichaDetalhe;

const inscricoes = (categoriaId: number) =>
    [{ id: categoriaId * 10, ordem: 1 }] as unknown as InscricoesDaCategoria;

function montar(
    lista: CategoriaPronta[],
    opcoes: {
        modelos?: Record<number, ModeloFichaDetalhe | null>;
        falha?: number[];
    } = {},
) {
    const gravados: PlanoDownload[] = [];
    const portas: PortasDownload = {
        listar: vi.fn(async () => lista),
        baixar: vi.fn(async (c: CategoriaPronta) => {
            if (opcoes.falha?.includes(c.id)) throw new Error("sem rede");
            return {
                inscricoes: inscricoes(c.id),
                modelo:
                    opcoes.modelos && c.id in opcoes.modelos
                        ? (opcoes.modelos[c.id] ?? null)
                        : modelo(100 + c.id),
            };
        }),
        gravar: vi.fn(async (plano: PlanoDownload) => {
            gravados.push(plano);
        }),
        avaliacoesAtuais: vi.fn(async (): Promise<AvaliacaoLocal[]> => []),
        congelar: vi.fn(async () => undefined),
    };
    return { portas, gravados };
}

describe("baixarCategorias", () => {
    it("grava a lista inteira e o download de cada categoria", async () => {
        const { portas, gravados } = montar([categoria(1), categoria(2)]);

        const resultado = await baixarCategorias(portas);

        expect(resultado).toEqual({ ok: true, falharam: [] });
        expect(gravados).toHaveLength(1);
        expect(gravados[0]?.categorias.map((c) => c.id)).toEqual([1, 2]);
        expect(gravados[0]?.downloads).toEqual([
            { categoriaId: 1, inscricoes: inscricoes(1), modelo: modelo(101) },
            { categoriaId: 2, inscricoes: inscricoes(2), modelo: modelo(102) },
        ]);
    });

    it("sem a lista, não grava nada: o download anterior fica", async () => {
        const { portas, gravados } = montar([categoria(1)]);
        portas.listar = async () => {
            throw new Error("sem rede");
        };

        expect(await baixarCategorias(portas)).toEqual({ ok: false });
        expect(gravados).toEqual([]);
        expect(portas.congelar).not.toHaveBeenCalled();
    });

    it("a categoria que falhou fica fora do plano e as outras seguem", async () => {
        const { portas, gravados } = montar(
            [categoria(1), categoria(2), categoria(3)],
            { falha: [2] },
        );

        expect(await baixarCategorias(portas)).toEqual({
            ok: true,
            falharam: [2],
        });
        // Continua na lista: o download anterior dela não sai.
        expect(gravados[0]?.categorias.map((c) => c.id)).toEqual([1, 2, 3]);
        expect(gravados[0]?.downloads.map((d) => d.categoriaId)).toEqual([
            1, 3,
        ]);
    });

    describe("congela a avaliação atual", () => {
        it("da categoria que saiu da lista", async () => {
            const { portas } = montar([categoria(1)]);
            portas.avaliacoesAtuais = async () => [
                atual("na-lista", 1, 101),
                atual("fora", 9, 109),
            ];

            await baixarCategorias(portas);

            expect(portas.congelar).toHaveBeenCalledOnce();
            expect(portas.congelar).toHaveBeenCalledWith(
                "fora",
                "Esta categoria não está mais aberta para avaliação.",
            );
        });

        it("cujo modelo mudou; a do mesmo modelo segue", async () => {
            const { portas } = montar([categoria(1), categoria(2)], {
                modelos: { 1: modelo(500) },
            });
            portas.avaliacoesAtuais = async () => [
                atual("mudou", 1, 101),
                atual("igual", 2, 102),
            ];

            await baixarCategorias(portas);

            expect(portas.congelar).toHaveBeenCalledOnce();
            expect(portas.congelar).toHaveBeenCalledWith(
                "mudou",
                "O modelo de ficha desta categoria mudou depois que esta avaliação começou.",
            );
        });

        it("da categoria que ficou sem modelo", async () => {
            const { portas } = montar([categoria(1)], { modelos: { 1: null } });
            portas.avaliacoesAtuais = async () => [atual("sem", 1, 101)];

            await baixarCategorias(portas);

            expect(portas.congelar).toHaveBeenCalledWith(
                "sem",
                "Esta categoria ficou sem modelo de ficha.",
            );
        });

        it("não, se o download da categoria falhou: nada se sabe dela", async () => {
            const { portas } = montar([categoria(1)], { falha: [1] });
            portas.avaliacoesAtuais = async () => [atual("talvez", 1, 101)];

            await baixarCategorias(portas);

            expect(portas.congelar).not.toHaveBeenCalled();
        });
    });
});

function atual(id: string, categoriaId: number, modeloId: number) {
    return {
        id,
        categoriaId,
        estado: "atual",
        motivoCongelado: null,
        modelo: modelo(modeloId),
    } as AvaliacaoLocal;
}
