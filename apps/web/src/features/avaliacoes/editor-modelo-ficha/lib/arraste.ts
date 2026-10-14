import type {
    Announcements,
    CollisionDetection,
    DataRef,
    DroppableContainer,
    ScreenReaderInstructions,
} from "@dnd-kit/core";
import { closestCenter, pointerWithin } from "@dnd-kit/core";

/**
 * O que cada coisa arrastável ou alvo carrega em `data`.
 *
 * - `global` — cartão do catálogo, que entra como posição nova;
 * - `posicao` — uma posição já na ficha, dentro do seu recipiente;
 * - `agrupamento` — o cartão de um agrupamento, pela alça;
 * - `recipiente` — o corpo de uma lista, alvo de quem cai no fim dela.
 *
 * `rotulo` é o que o leitor de tela anuncia.
 */
export type DadosArraste =
    | { tipo: "global"; campoId: number; rotulo: string }
    | { tipo: "posicao"; recipiente: string; rotulo: string }
    | { tipo: "agrupamento"; rotulo: string }
    | { tipo: "recipiente"; recipiente: string; rotulo: string };

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

/**
 * Quem pode cair onde.
 *
 * Uma posição só troca de lugar dentro do próprio recipiente: o backend numera
 * campos gerais e agrupamentos em sequências separadas, e mover entre eles
 * espera a ordem única descrita em `docs/planos/modelo-ficha-backend.md`.
 */
function aceita(ativo: DadosArraste | undefined, alvo: DroppableContainer) {
    const dadosAlvo = dadosDe(alvo.data);
    if (!ativo || !dadosAlvo) return false;

    switch (ativo.tipo) {
        case "global":
            return (
                dadosAlvo.tipo === "posicao" || dadosAlvo.tipo === "recipiente"
            );
        case "posicao":
            return (
                dadosAlvo.tipo === "posicao" &&
                dadosAlvo.recipiente === ativo.recipiente
            );
        case "agrupamento":
            return dadosAlvo.tipo === "agrupamento";
        case "recipiente":
            return false;
    }
}

/**
 * Para o campo do catálogo vale o que está sob o ponteiro — a posição antes do
 * recipiente que a contém, porque cair sobre ela insere naquele ponto. Pelo
 * teclado não há ponteiro, e vale o alvo mais próximo. Reordenar usa o centro
 * mais próximo, como em qualquer lista.
 */
export const deteccaoColisao: CollisionDetection = (args) => {
    const ativo = dadosDe(args.active.data);
    const alvos = args.droppableContainers.filter((alvo) =>
        aceita(ativo, alvo),
    );
    const filtrado = { ...args, droppableContainers: alvos };

    if (ativo?.tipo === "global" && args.pointerCoordinates) {
        const idsPosicao = new Set(
            alvos
                .filter((alvo) => dadosDe(alvo.data)?.tipo === "posicao")
                .map((alvo) => alvo.id),
        );
        const sob = pointerWithin(filtrado);
        const posicoes = sob.filter((colisao) => idsPosicao.has(colisao.id));
        return posicoes.length > 0 ? posicoes : sob;
    }

    return closestCenter(filtrado);
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
