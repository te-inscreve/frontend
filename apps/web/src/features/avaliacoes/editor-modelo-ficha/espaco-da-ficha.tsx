"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";

import type { OpcaoInsercao } from "./insercao";
import type { DadosArraste } from "./lib/arraste";
import { useEditor } from "./editor-contexto";
import { Insercao } from "./insercao";
import { idEspacoArraste } from "./lib/arraste";
import {
    novaPosicaoExclusiva,
    novoAgrupamento,
} from "./lib/modelo-ficha-form-schema";

interface Props {
    /** O lugar na sequência da ficha onde o que entra aqui fica. */
    indice: number;
    /** Onde é, para o leitor de tela: "depois do agrupamento Danças". */
    descricao: string;
    sempreVisivel?: boolean;
}

/**
 * O vão no topo da ficha, ao lado de um agrupamento: o "+" cria ali um campo
 * geral exclusivo ou um agrupamento, e o vão recebe o que for arrastado para
 * aquele ponto — campo do catálogo, campo geral ou agrupamento.
 *
 * Entre dois campos gerais não há vão: ali o alvo é o próprio cartão do campo.
 */
export function EspacoDaFicha({ indice, descricao, sempreVisivel }: Props) {
    const { composicao, selecionar } = useEditor();
    const { over } = useDndContext();

    const id = idEspacoArraste(indice);
    const dados: DadosArraste = { tipo: "espaco", indice, rotulo: descricao };
    const { setNodeRef } = useDroppable({ id, data: dados });

    const opcoes: OpcaoInsercao[] = [
        {
            rotulo: "Criar campo exclusivo",
            aoEscolher: () => {
                const posicao = novaPosicaoExclusiva();
                composicao.inserirCampoGeral(posicao, indice);
                selecionar(posicao.chave);
            },
        },
        {
            rotulo: "Criar agrupamento",
            aoEscolher: () =>
                composicao.inserirAgrupamento(novoAgrupamento(), indice),
        },
    ];

    return (
        <div ref={setNodeRef}>
            <Insercao
                sempreVisivel={sempreVisivel}
                recebendo={over?.id === id}
                descricao={descricao}
                opcoes={opcoes}
            />
        </div>
    );
}
