import type {
    Active,
    Announcements,
    CollisionDetection,
    DataRef,
    DroppableContainer,
    Modifier,
    Over,
    ScreenReaderInstructions,
} from "@dnd-kit/core";
import { closestCenter, pointerWithin } from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";

import { ehDosGerais } from "../use-composicao";

/**
 * O que cada coisa arrastável ou alvo carrega em `data`.
 *
 * - `global` — cartão do catálogo, que entra como posição nova;
 * - `posicao` — uma posição já na ficha, dentro do seu recipiente;
 * - `agrupamento` — o cartão de um agrupamento, pela alça;
 * - `recipiente` — o corpo de uma lista, alvo de quem cai no fim dela;
 * - `espaco` — o vão antes ou depois de um agrupamento, alvo de quem entra no
 *   topo da ficha naquele ponto: `indice` é o lugar na sequência.
 *
 * `rotulo` é o que o leitor de tela anuncia.
 */
export type DadosArraste =
    | { tipo: "global"; campoId: number; rotulo: string }
    | { tipo: "posicao"; recipiente: string; rotulo: string }
    | { tipo: "agrupamento"; rotulo: string }
    | { tipo: "recipiente"; recipiente: string; rotulo: string }
    | { tipo: "espaco"; indice: number; rotulo: string };

export function dadosDe(
    ref: DataRef | undefined | null,
): DadosArraste | undefined {
    return ref?.current as DadosArraste | undefined;
}

export function idRecipienteArraste(recipiente: string) {
    return `recipiente:${recipiente}`;
}

export function idGlobalArraste(campoId: number) {
    return `global:${campoId}`;
}

export function idEspacoArraste(indice: number) {
    return `espaco:${indice}`;
}

/**
 * O que mora no topo da ficha e troca de lugar nele: o agrupamento e o campo
 * geral. Os dois dividem uma sequência só, então um vai para antes ou depois
 * do outro.
 */
export function ehDoTopo(dados: DadosArraste | undefined) {
    return (
        dados?.tipo === "agrupamento" ||
        (dados?.tipo === "posicao" && ehDosGerais(dados.recipiente))
    );
}

/**
 * Quem pode cair onde.
 *
 * Campo geral e agrupamento se movem pelo topo da ficha: sobre outro campo
 * geral, sobre outro agrupamento ou num espaço entre eles. O campo de um
 * agrupamento só troca de lugar dentro dele.
 */
function aceita(ativo: DadosArraste | undefined, alvo: DroppableContainer) {
    const dadosAlvo = dadosDe(alvo.data);
    if (!ativo || !dadosAlvo) return false;

    if (ehDoTopo(ativo)) {
        return ehDoTopo(dadosAlvo) || dadosAlvo.tipo === "espaco";
    }

    switch (ativo.tipo) {
        case "global":
            return (
                dadosAlvo.tipo === "posicao" ||
                dadosAlvo.tipo === "recipiente" ||
                dadosAlvo.tipo === "espaco"
            );
        case "posicao":
            return (
                dadosAlvo.tipo === "posicao" &&
                dadosAlvo.recipiente === ativo.recipiente
            );
        default:
            return false;
    }
}

/**
 * Vale o que está sob o ponteiro. Para o campo do catálogo, a posição antes do
 * recipiente que a contém, porque cair sobre ela insere naquele ponto. No
 * topo, o campo geral ou o espaço antes do agrupamento que os contém — o
 * cartão do agrupamento pega o ponteiro em toda a sua altura, e a sobra do
 * arraste dele fica longe do ponteiro. Entre dois alvos, e pelo teclado, sem
 * ponteiro, vale o centro mais próximo, como em qualquer lista.
 */
export const deteccaoColisao: CollisionDetection = (args) => {
    const ativo = dadosDe(args.active.data);
    const alvos = args.droppableContainers.filter((alvo) =>
        aceita(ativo, alvo),
    );
    const filtrado = { ...args, droppableContainers: alvos };

    if (
        args.pointerCoordinates &&
        (ativo?.tipo === "global" || ehDoTopo(ativo))
    ) {
        const sob = pointerWithin(filtrado);
        const idsQueContem = new Set(
            alvos
                .filter((alvo) => {
                    const tipo = dadosDe(alvo.data)?.tipo;
                    return tipo === "recipiente" || tipo === "agrupamento";
                })
                .map((alvo) => alvo.id),
        );
        const precisos = sob.filter((colisao) => !idsQueContem.has(colisao.id));
        if (precisos.length > 0) return precisos;
        if (sob.length > 0) return sob;
    }

    return closestCenter(filtrado);
};

/**
 * Onde o item do topo arrastado vai cair em relação ao alvo `chave`: antes ou
 * depois dele, pela regra de `moverParaOLugarDe`, da composição. `null`
 * quando o alvo não é esse, ou quando o arraste é dentro de um mesmo trecho
 * de campos gerais — ali a grade já abre a vaga.
 */
export function ladoDaSoltura(
    active: Active | null,
    over: Over | null,
    chave: string,
    chavesDoTopo: string[],
): "antes" | "depois" | null {
    if (!active || over?.id !== chave || active.id === chave) return null;
    const ativo = dadosDe(active.data);
    if (!ehDoTopo(ativo)) return null;

    const alvo = dadosDe(over.data);
    if (
        ativo?.tipo === "posicao" &&
        alvo?.tipo === "posicao" &&
        alvo.recipiente === ativo.recipiente
    ) {
        return null;
    }

    const de = chavesDoTopo.indexOf(String(active.id));
    const para = chavesDoTopo.indexOf(chave);
    if (de === -1 || para === -1) return null;
    return de > para ? "antes" : "depois";
}

/**
 * Prende a sobra do arraste ao ponteiro, um pouco acima e à esquerda dele. O
 * agrupamento se arrasta pela alça, que cobre a altura do cartão: sem isso, a
 * sobra nasceria no canto do cartão, longe de onde a pessoa pegou. Pelo
 * teclado não há ponteiro, e nada muda.
 */
export const prenderAoPonteiro: Modifier = ({
    activatorEvent,
    draggingNodeRect,
    transform,
}) => {
    if (!activatorEvent || !draggingNodeRect) return transform;
    const ponto = getEventCoordinates(activatorEvent);
    if (!ponto) return transform;
    return {
        ...transform,
        x: transform.x + ponto.x - draggingNodeRect.left - 16,
        y: transform.y + ponto.y - draggingNodeRect.top - 16,
    };
};

export const instrucoesLeitorTela: ScreenReaderInstructions = {
    draggable:
        "Para arrastar, pressione espaço ou enter. Use as setas para mover, espaço ou enter para soltar e esc para cancelar.",
};

export const anunciosArraste: Announcements = {
    onDragStart({ active }) {
        return `${dadosDe(active.data)?.rotulo ?? "Item"} selecionado para arrastar.`;
    },
    onDragOver({ active, over }) {
        const rotulo = dadosDe(active.data)?.rotulo ?? "Item";
        if (!over) return `${rotulo} fora de um lugar válido.`;
        return `${rotulo} sobre ${dadosDe(over.data)?.rotulo ?? "a ficha"}.`;
    },
    onDragEnd({ active, over }) {
        const rotulo = dadosDe(active.data)?.rotulo ?? "Item";
        if (!over) return `${rotulo} solto fora da ficha. Nada mudou.`;
        return `${rotulo} solto em ${dadosDe(over.data)?.rotulo ?? "a ficha"}.`;
    },
    onDragCancel({ active }) {
        return `Arraste de ${dadosDe(active.data)?.rotulo ?? "item"} cancelado.`;
    },
};
