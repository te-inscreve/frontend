import { useSyncExternalStore } from "react";

import type { Fila } from "./fila";

/**
 * Filas de exemplo, uma por estado. O `estado` e as listas concordam, como a
 * fila real fará.
 */
const sincronizada: Fila = {
    estado: { tipo: "sincronizado" },
    naFila: [],
    comErro: [],
};

const filasDeExemplo: Fila[] = [
    sincronizada,
    {
        estado: { tipo: "sincronizando", enviadas: 1, total: 3 },
        naFila: [
            { id: "2", concorrente: "Ana Souza", categoria: "Juvenil" },
            { id: "3", concorrente: "Bruno Lima", categoria: "Juvenil" },
        ],
        comErro: [],
    },
    {
        estado: { tipo: "pausado", naFila: 2 },
        naFila: [
            { id: "2", concorrente: "Ana Souza", categoria: "Juvenil" },
            { id: "3", concorrente: "Bruno Lima", categoria: "Juvenil" },
        ],
        comErro: [],
    },
    {
        estado: { tipo: "com_erro", comErro: 1 },
        naFila: [],
        comErro: [
            {
                id: "4",
                concorrente: "Carla Dias",
                categoria: "Mirim",
                motivo: "A categoria já foi encerrada.",
            },
        ],
    },
];

let filaAtual = sincronizada;
const ouvintes = new Set<() => void>();

function assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
}

function lerFila() {
    return filaAtual;
}

/**
 * A fila de envio que o cabeçalho resume e o detalhe da fila lista.
 *
 * Provisório: a fila ainda não existe, então serve filas de exemplo. É o único
 * ponto a trocar quando ela existir (TE-90); quem chama só conhece `Fila`.
 * Começa sincronizada; {@link avancarFilaDeExemplo} percorre os outros
 * estados para vê-los na tela.
 */
export function useFila(): Fila {
    return useSyncExternalStore(assinar, lerFila);
}

/**
 * Passa para o próximo estado de exemplo, em ciclo. Só para desenvolvimento:
 * o botão que o chama no detalhe da fila some no build de produção, e a
 * função vai embora junto com {@link filasDeExemplo} quando a fila existir.
 */
export function avancarFilaDeExemplo() {
    const proximo =
        (filasDeExemplo.indexOf(filaAtual) + 1) % filasDeExemplo.length;
    filaAtual = filasDeExemplo[proximo] ?? sincronizada;
    ouvintes.forEach((ouvinte) => ouvinte());
}
