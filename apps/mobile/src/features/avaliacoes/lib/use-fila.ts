import type { Fila } from "./fila";

/**
 * A fila de envio que o cabeçalho resume e o detalhe da fila lista.
 *
 * Provisório: a fila ainda não existe, então devolve uma fila fixa. É o único
 * ponto a trocar quando ela existir (TE-90); quem chama só conhece `Fila`.
 * Para ver os outros estados na tela, troque o valor abaixo — o `estado` e as
 * listas devem concordar, como a fila real fará.
 */
export function useFila(): Fila {
    return { estado: { tipo: "sincronizado" }, naFila: [], comErro: [] };
}
