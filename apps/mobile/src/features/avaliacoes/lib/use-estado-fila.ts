import type { EstadoFila } from "./estado-fila";

/**
 * O estado da fila de envio que o cabeçalho mostra.
 *
 * Provisório: a fila ainda não existe, então devolve um estado fixo. É o único
 * ponto a trocar quando ela existir (TE-90); quem chama só conhece
 * `EstadoFila`. Para ver os outros estados na tela, troque o valor abaixo.
 */
export function useEstadoFila(): EstadoFila {
    return { tipo: "sincronizado" };
}
