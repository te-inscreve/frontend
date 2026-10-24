import type { EstadoFila } from "./estado-fila";
import type { AvaliacaoLocal } from "~/db/schema";

/** Uma avaliação na fila: salva pelo avaliador, aguardando envio. */
export interface AvaliacaoNaFila {
    id: string;
    /** O nome do concorrente da inscrição avaliada. */
    concorrente: string;
    /** O nome da categoria da inscrição. */
    categoria: string;
}

/** Uma avaliação com erro: o backend a recusou de vez. */
export interface AvaliacaoComErro extends AvaliacaoNaFila {
    /** Por que o backend recusou, no texto que o avaliador lê. */
    motivo: string;
}

/**
 * A fila de envio inteira: o estado que a dock resume e as avaliações que o
 * detalhe da fila lista.
 */
export interface Fila {
    estado: EstadoFila;
    naFila: AvaliacaoNaFila[];
    comErro: AvaliacaoComErro[];
}

/**
 * A fila a partir das linhas do banco em `na_fila`, `enviando` e `com_erro`,
 * já na ordem de envio. O estado segue a gravidade: um erro pede ação do
 * avaliador e vence o resto; depois, o envio em curso; depois, a espera.
 */
export function filaDasAvaliacoes(linhas: AvaliacaoLocal[]): Fila {
    const naFila = linhas
        .filter((linha) => linha.estado !== "com_erro")
        .map(itemDaFila);
    const comErro = linhas
        .filter((linha) => linha.estado === "com_erro")
        .map((linha) => ({
            ...itemDaFila(linha),
            motivo: linha.erro?.mensagem ?? "O servidor recusou a avaliação.",
        }));
    const enviando = linhas.some((linha) => linha.estado === "enviando");

    let estado: EstadoFila;
    if (comErro.length > 0)
        estado = { tipo: "com_erro", comErro: comErro.length };
    else if (enviando)
        estado = { tipo: "sincronizando", enviadas: 0, total: naFila.length };
    else if (naFila.length > 0)
        estado = { tipo: "aguardando", naFila: naFila.length };
    else estado = { tipo: "sincronizado" };

    return { estado, naFila, comErro };
}

function itemDaFila(linha: AvaliacaoLocal): AvaliacaoNaFila {
    return {
        id: linha.id,
        concorrente: linha.inscricao.concorrente,
        categoria: linha.inscricao.categoria,
    };
}
