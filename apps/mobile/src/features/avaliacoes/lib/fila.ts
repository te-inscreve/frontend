import type { EstadoFila } from "./estado-fila";

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
 * A fila de envio inteira: o estado que o cabeçalho resume e as avaliações
 * que o detalhe da fila lista.
 */
export interface Fila {
    estado: EstadoFila;
    naFila: AvaliacaoNaFila[];
    comErro: AvaliacaoComErro[];
}
