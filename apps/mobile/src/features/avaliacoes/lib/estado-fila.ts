/**
 * Como está a fila de envio das avaliações, com as contagens que cada caso
 * mostra. O cabeçalho só conhece este tipo; quem o produz é `useFila`.
 */
export type EstadoFila =
    /** A fila está vazia: toda avaliação salva já foi aceita pelo backend. */
    | { tipo: "sincronizado" }
    /** A fila está enviando; `enviadas` conta as já aceitas desta rodada. */
    | { tipo: "sincronizando"; enviadas: number; total: number }
    /** Há avaliações na fila, e o envio espera a conexão voltar. */
    | { tipo: "pausado"; naFila: number }
    /** O backend recusou de vez alguma avaliação. */
    | { tipo: "com_erro"; comErro: number };

/** O texto curto do estado, o mesmo para a tela e para o leitor de tela. */
export function descreverEstadoFila(estado: EstadoFila): string {
    switch (estado.tipo) {
        case "sincronizado":
            return "Tudo sincronizado";
        case "sincronizando":
            return `Enviando ${estado.enviadas} de ${estado.total}`;
        case "pausado":
            return `${estado.naFila} na fila, sem conexão`;
        case "com_erro":
            return estado.comErro === 1
                ? "1 avaliação com erro"
                : `${estado.comErro} avaliações com erro`;
    }
}

/**
 * O que o avaliador pode esperar do estado, para o detalhe da fila: o texto
 * curto diz o que acontece; este, o que vem depois.
 */
export function explicarEstadoFila(estado: EstadoFila): string {
    switch (estado.tipo) {
        case "sincronizado":
            return "Todas as avaliações salvas já foram aceitas.";
        case "sincronizando":
            return "As avaliações seguem para o servidor uma a uma.";
        case "pausado":
            return "O envio continua sozinho quando a conexão voltar.";
        case "com_erro":
            return "O servidor recusou estas avaliações; as outras seguem na fila.";
    }
}
