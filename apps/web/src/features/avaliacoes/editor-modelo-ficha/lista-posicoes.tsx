"use client";

import type { ReactNode } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import { cn } from "@te-inscreve/components/utils";

import type { OpcaoInsercao } from "./insercao";
import type { DadosArraste } from "./lib/arraste";
import type { PosicaoForm } from "./lib/modelo-ficha-form-schema";
import type { Recipiente } from "./use-composicao";
import { useEditor } from "./editor-contexto";
import { Insercao } from "./insercao";
import { dadosDe, idRecipienteArraste } from "./lib/arraste";
import { novaPosicaoExclusiva } from "./lib/modelo-ficha-form-schema";
import { PosicaoEditavel } from "./posicao-editavel";
import { idRecipiente } from "./use-composicao";

interface Props {
    recipiente: Recipiente;
    posicoes: PosicaoForm[];
    /**
     * Caminho de cada posição no formulário, pelo índice na lista:
     * `camposGerais.4` ou `agrupamentos.2.campos.0`.
     */
    caminhoDaPosicao: (indice: number) => string;
    rotulo: string;
    /** Opções a mais do "+" do fim da lista — o agrupamento, nos gerais. */
    opcoesFinais?: OpcaoInsercao[];
    vazia: ReactNode;
}

/**
 * Uma lista de posições — um trecho de campos gerais, ou os campos de um
 * agrupamento — numa grade de cartões que quebra linha: reordena por arraste,
 * recebe campos do catálogo e termina num cartão "+" para criar um campo
 * exclusivo.
 *
 * Numa grade não há "entre dois" onde morar um "+", então o exclusivo nasce
 * no fim e vai para o lugar arrastado. O campo do catálogo continua caindo
 * onde é solto.
 */
export function ListaPosicoes({
    recipiente,
    posicoes,
    caminhoDaPosicao,
    rotulo,
    opcoesFinais = [],
    vazia,
}: Props) {
    const { composicao, selecionar } = useEditor();
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
                rotulo: "Criar campo",
                aoEscolher: () => criarExclusivo(indice),
            },
        ];
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
                strategy={rectSortingStrategy}
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
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
                        {posicoes.map((posicao, indice) => (
                            <PosicaoEditavel
                                key={posicao.chave}
                                posicao={posicao}
                                recipiente={recipiente}
                                caminho={caminhoDaPosicao(indice)}
                            />
                        ))}
                        <Insercao
                            cartao
                            recebendo={recebendoNoFim}
                            descricao={`no fim de ${rotulo}`}
                            opcoes={[
                                ...opcoesEm(posicoes.length),
                                ...opcoesFinais,
                            ]}
                        />
                    </div>
                )}
            </SortableContext>
        </div>
    );
}
