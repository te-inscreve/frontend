"use client";

import type { ReactNode } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { cn } from "@te-inscreve/components/utils";

import type { OpcaoInsercao } from "./insercao";
import type { DadosArraste } from "./lib/arraste";
import type { PosicaoForm } from "./lib/modelo-ficha-form-schema";
import type { Recipiente } from "./use-composicao";
import { useEditor } from "./editor-contexto";
import { Insercao } from "./insercao";
import { dadosDe, idRecipienteArraste } from "./lib/arraste";
import { novaPosicaoExclusiva } from "./lib/modelo-ficha-form-schema";
import { campoDaPosicao, PosicaoEditavel } from "./posicao-editavel";
import { idRecipiente } from "./use-composicao";

interface Props {
    recipiente: Recipiente;
    posicoes: PosicaoForm[];
    /** Caminho da lista no formulário: `camposGerais` ou `agrupamentos.2.campos`. */
    caminho: string;
    rotulo: string;
    /** Opções a mais do "+" do fim da lista — o agrupamento, nos gerais. */
    opcoesFinais?: OpcaoInsercao[];
    vazia: ReactNode;
}

/**
 * Uma lista de posições — os campos gerais, ou os de um agrupamento: reordena
 * por arraste, recebe campos do catálogo e tem um "+" entre cada par para
 * criar um campo exclusivo naquele ponto.
 */
export function ListaPosicoes({
    recipiente,
    posicoes,
    caminho,
    rotulo,
    opcoesFinais = [],
    vazia,
}: Props) {
    const { camposGlobais, composicao, selecionar } = useEditor();
    const { active, over } = useDndContext();

    const id = idRecipiente(recipiente);
    const dados: DadosArraste = { tipo: "recipiente", recipiente: id, rotulo };
    const { setNodeRef } = useDroppable({
        id: idRecipienteArraste(id),
        data: dados,
    });

    const recebendoNoFim =
        dadosDe(active?.data)?.tipo === "global" &&
        over?.id === idRecipienteArraste(id);

    function criarExclusivo(indice: number) {
        const posicao = novaPosicaoExclusiva();
        composicao.inserirPosicao(recipiente, posicao, indice);
        selecionar(posicao.chave);
    }

    function opcoesEm(indice: number): OpcaoInsercao[] {
        return [
            {
                rotulo: "Criar campo exclusivo",
                aoEscolher: () => criarExclusivo(indice),
            },
        ];
    }

    function nome(indice: number) {
        const posicao = posicoes[indice];
        return posicao
            ? (campoDaPosicao(posicao, camposGlobais)?.nome ?? "campo")
            : "campo";
    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col rounded-md transition-colors",
                recebendoNoFim && "bg-primary/5",
            )}
        >
            <SortableContext
                items={posicoes.map((posicao) => posicao.chave)}
                strategy={verticalListSortingStrategy}
            >
                {posicoes.length === 0 ? (
                    <div
                        className={cn(
                            "text-muted-foreground flex flex-col items-center gap-1 rounded-md border border-dashed px-4 py-6 text-center text-sm",
                            recebendoNoFim && "border-primary text-primary",
                        )}
                    >
                        {vazia}
                        <Insercao
                            sempreVisivel
                            descricao={`em ${rotulo}`}
                            opcoes={[...opcoesEm(0), ...opcoesFinais]}
                        />
                    </div>
                ) : (
                    <>
                        <Insercao
                            descricao={`antes de ${nome(0)}`}
                            opcoes={opcoesEm(0)}
                        />
                        {posicoes.map((posicao, indice) => (
                            <div key={posicao.chave}>
                                <PosicaoEditavel
                                    posicao={posicao}
                                    recipiente={recipiente}
                                    caminho={`${caminho}.${indice}`}
                                />
                                <Insercao
                                    descricao={`depois de ${nome(indice)}`}
                                    opcoes={
                                        indice === posicoes.length - 1
                                            ? [
                                                  ...opcoesEm(indice + 1),
                                                  ...opcoesFinais,
                                              ]
                                            : opcoesEm(indice + 1)
                                    }
                                />
                            </div>
                        ))}
                        {recebendoNoFim && (
                            <span
                                aria-hidden="true"
                                className="bg-primary -mt-3 mb-2.5 h-0.5 rounded-full"
                            />
                        )}
                    </>
                )}
            </SortableContext>
        </div>
    );
}
