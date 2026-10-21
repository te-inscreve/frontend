"use client";

import type { UseFormReturn } from "react-hook-form";
import { useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import type {
    AgrupamentoForm,
    ItemDaFicha,
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";
import {
    chaveDoItem,
    listasDaSequencia,
    sequenciaDaFicha,
} from "./lib/modelo-ficha-form-schema";

/**
 * Onde uma posição mora: um trecho de campos gerais seguidos, ou os campos de
 * um agrupamento.
 *
 * O trecho é identificado pelo lugar, na sequência da ficha, do seu primeiro
 * campo — entre dois trechos há sempre um agrupamento. O agrupamento, pela
 * `chave`: o índice muda quando os agrupamentos trocam de lugar, a chave não.
 */
export type Recipiente = { gerais: number } | { agrupamento: string };

const PREFIXO_GERAIS = "gerais:";

export function idRecipiente(recipiente: Recipiente) {
    return "gerais" in recipiente
        ? `${PREFIXO_GERAIS}${recipiente.gerais}`
        : recipiente.agrupamento;
}

export function recipienteDe(id: string): Recipiente {
    return id.startsWith(PREFIXO_GERAIS)
        ? { gerais: Number(id.slice(PREFIXO_GERAIS.length)) }
        : { agrupamento: id };
}

/** Se o recipiente é um trecho de campos gerais, pelo id de {@link idRecipiente}. */
export function ehDosGerais(id: string) {
    return id.startsWith(PREFIXO_GERAIS);
}

/**
 * As mudanças de estrutura da ficha — inserir, mover, tirar posições e
 * agrupamentos.
 *
 * As listas não usam `useFieldArray`: o arraste entra de fora (o catálogo) em
 * qualquer lista, e um `useFieldArray` por agrupamento espalharia essas
 * operações pelos componentes. Aqui cada mudança reescreve a lista inteira com
 * `setValue`, e quem desenha lê com `useWatch`.
 *
 * O que mexe no topo da ficha — campo geral ou agrupamento — passa pela
 * sequência: tira, põe ou move ali, e grava as duas listas renumeradas, para
 * que a `ordem` de um nunca repita a de outro.
 */
export function useComposicao(form: UseFormReturn<ModeloFichaFormValues>) {
    return useMemo(() => {
        const opcoes = () => ({
            shouldDirty: true,
            // Depois da primeira tentativa de envio, cada mudança revalida —
            // a mensagem "agrupamento vazio" some assim que o campo entra.
            shouldValidate: form.formState.isSubmitted,
        });

        function lerSequencia() {
            return sequenciaDaFicha(form.getValues());
        }

        function gravarSequencia(itens: ItemDaFicha[]) {
            const { camposGerais, agrupamentos } = listasDaSequencia(itens);
            form.setValue("camposGerais", camposGerais, opcoes());
            form.setValue("agrupamentos", agrupamentos, opcoes());
        }

        function inserirNaSequencia(item: ItemDaFicha, indice: number) {
            const itens = lerSequencia();
            itens.splice(indice, 0, item);
            gravarSequencia(itens);
        }

        function lerPosicoes(recipiente: Recipiente): PosicaoForm[] {
            if ("gerais" in recipiente) {
                const trecho: PosicaoForm[] = [];
                for (const item of lerSequencia().slice(recipiente.gerais)) {
                    if (item.tipo !== "campo") break;
                    trecho.push(item.posicao);
                }
                return trecho;
            }
            return (
                form
                    .getValues("agrupamentos")
                    .find(
                        (agrupamento) =>
                            agrupamento.chave === recipiente.agrupamento,
                    )?.campos ?? []
            );
        }

        function gravarCamposDoAgrupamento(
            chave: string,
            posicoes: PosicaoForm[],
        ) {
            const indice = form
                .getValues("agrupamentos")
                .findIndex((agrupamento) => agrupamento.chave === chave);
            if (indice === -1) return;
            form.setValue(`agrupamentos.${indice}.campos`, posicoes, opcoes());
        }

        function removerDaSequencia(chave: string) {
            gravarSequencia(
                lerSequencia().filter((item) => chaveDoItem(item) !== chave),
            );
        }

        return {
            lerPosicoes,

            /** Sem `indice`, entra no fim da lista — do trecho, nos gerais. */
            inserirPosicao(
                recipiente: Recipiente,
                posicao: PosicaoForm,
                indice?: number,
            ) {
                if ("gerais" in recipiente) {
                    inserirNaSequencia(
                        { tipo: "campo", posicao },
                        recipiente.gerais +
                            (indice ?? lerPosicoes(recipiente).length),
                    );
                    return;
                }
                const posicoes = [...lerPosicoes(recipiente)];
                posicoes.splice(indice ?? posicoes.length, 0, posicao);
                gravarCamposDoAgrupamento(recipiente.agrupamento, posicoes);
            },

            /** Reordena os campos de um agrupamento. */
            moverPosicao(chaveAgrupamento: string, de: number, para: number) {
                gravarCamposDoAgrupamento(
                    chaveAgrupamento,
                    arrayMove(
                        lerPosicoes({ agrupamento: chaveAgrupamento }),
                        de,
                        para,
                    ),
                );
            },

            removerPosicao(recipiente: Recipiente, chave: string) {
                if ("gerais" in recipiente) {
                    removerDaSequencia(chave);
                    return;
                }
                gravarCamposDoAgrupamento(
                    recipiente.agrupamento,
                    lerPosicoes(recipiente).filter(
                        (posicao) => posicao.chave !== chave,
                    ),
                );
            },

            /** Um campo geral em `indice` da sequência da ficha. */
            inserirCampoGeral(posicao: PosicaoForm, indice: number) {
                inserirNaSequencia({ tipo: "campo", posicao }, indice);
            },

            /** Um agrupamento em `indice` da sequência da ficha. */
            inserirAgrupamento(agrupamento: AgrupamentoForm, indice: number) {
                inserirNaSequencia(
                    { tipo: "agrupamento", agrupamento },
                    indice,
                );
            },

            removerAgrupamento: removerDaSequencia,

            /**
             * Leva um item do topo para o lugar de outro, como numa lista
             * reordenável: quem vem de cima passa para depois do alvo, quem
             * vem de baixo, para antes.
             */
            moverParaOLugarDe(chave: string, chaveAlvo: string) {
                const itens = lerSequencia();
                const chaves = itens.map(chaveDoItem);
                const de = chaves.indexOf(chave);
                const para = chaves.indexOf(chaveAlvo);
                if (de === -1 || para === -1 || de === para) return;
                gravarSequencia(arrayMove(itens, de, para));
            },

            /**
             * Leva um item do topo para o espaço antes do item em `indice` da
             * sequência — `indice` igual ao tamanho dela é o fim.
             */
            moverParaEspaco(chave: string, indice: number) {
                const itens = lerSequencia();
                const de = itens.findIndex(
                    (item) => chaveDoItem(item) === chave,
                );
                if (de === -1) return;
                const [item] = itens.splice(de, 1);
                if (!item) return;
                itens.splice(indice > de ? indice - 1 : indice, 0, item);
                gravarSequencia(itens);
            },
        };
    }, [form]);
}

export type Composicao = ReturnType<typeof useComposicao>;
