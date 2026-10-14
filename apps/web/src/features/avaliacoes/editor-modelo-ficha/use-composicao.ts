"use client";

import type { UseFormReturn } from "react-hook-form";
import { useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import type {
    AgrupamentoForm,
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";

/**
 * Onde uma posição mora: a lista de campos gerais, ou os campos de um
 * agrupamento, identificado pela `chave` — o índice muda quando os
 * agrupamentos trocam de lugar, a chave não.
 */
export type Recipiente = "gerais" | { agrupamento: string };

export function idRecipiente(recipiente: Recipiente) {
    return recipiente === "gerais" ? "gerais" : recipiente.agrupamento;
}

/**
 * As mudanças de estrutura da ficha — inserir, mover, tirar posições e
 * agrupamentos.
 *
 * As listas não usam `useFieldArray`: o arraste entra de fora (o catálogo) em
 * qualquer lista, e um `useFieldArray` por agrupamento espalharia essas
 * operações pelos componentes. Aqui cada mudança reescreve a lista inteira com
 * `setValue`, e quem desenha lê com `useWatch`.
 */
export function useComposicao(form: UseFormReturn<ModeloFichaFormValues>) {
    return useMemo(() => {
        const opcoes = () => ({
            shouldDirty: true,
            // Depois da primeira tentativa de envio, cada mudança revalida —
            // a mensagem "agrupamento vazio" some assim que o campo entra.
            shouldValidate: form.formState.isSubmitted,
        });

        function lerPosicoes(recipiente: Recipiente): PosicaoForm[] {
            if (recipiente === "gerais") return form.getValues("camposGerais");
            return (
                form
                    .getValues("agrupamentos")
                    .find(
                        (agrupamento) =>
                            agrupamento.chave === recipiente.agrupamento,
                    )?.campos ?? []
            );
        }

        function gravarPosicoes(
            recipiente: Recipiente,
            posicoes: PosicaoForm[],
        ) {
            if (recipiente === "gerais") {
                form.setValue("camposGerais", posicoes, opcoes());
                return;
            }
            const indice = form
                .getValues("agrupamentos")
                .findIndex(
                    (agrupamento) =>
                        agrupamento.chave === recipiente.agrupamento,
                );
            if (indice === -1) return;
            form.setValue(`agrupamentos.${indice}.campos`, posicoes, opcoes());
        }

        function gravarAgrupamentos(agrupamentos: AgrupamentoForm[]) {
            form.setValue("agrupamentos", agrupamentos, opcoes());
        }

        return {
            lerPosicoes,

            /** Sem `indice`, entra no fim da lista. */
            inserirPosicao(
                recipiente: Recipiente,
                posicao: PosicaoForm,
                indice?: number,
            ) {
                const posicoes = [...lerPosicoes(recipiente)];
                posicoes.splice(indice ?? posicoes.length, 0, posicao);
                gravarPosicoes(recipiente, posicoes);
            },

            moverPosicao(recipiente: Recipiente, de: number, para: number) {
                gravarPosicoes(
                    recipiente,
                    arrayMove(lerPosicoes(recipiente), de, para),
                );
            },

            removerPosicao(recipiente: Recipiente, chave: string) {
                gravarPosicoes(
                    recipiente,
                    lerPosicoes(recipiente).filter(
                        (posicao) => posicao.chave !== chave,
                    ),
                );
            },

            /** Sempre no fim: agrupamento só existe depois dos campos gerais. */
            inserirAgrupamento(agrupamento: AgrupamentoForm) {
                gravarAgrupamentos([
                    ...form.getValues("agrupamentos"),
                    agrupamento,
                ]);
            },

            moverAgrupamento(de: number, para: number) {
                gravarAgrupamentos(
                    arrayMove(form.getValues("agrupamentos"), de, para),
                );
            },

            removerAgrupamento(chave: string) {
                gravarAgrupamentos(
                    form
                        .getValues("agrupamentos")
                        .filter((agrupamento) => agrupamento.chave !== chave),
                );
            },
        };
    }, [form]);
}

export type Composicao = ReturnType<typeof useComposicao>;
