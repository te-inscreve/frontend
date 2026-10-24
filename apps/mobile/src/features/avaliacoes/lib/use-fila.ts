import { useMemo } from "react";

import type { Fila } from "./fila";
import { useSession } from "~/utils/auth";
import { useAvaliacoesDaFila } from "./avaliacoes-locais";
import { filaDasAvaliacoes } from "./fila";

/**
 * A fila de envio do avaliador logado, que a dock resume e o detalhe da fila
 * lista. Lê o banco local ao vivo: salvar uma avaliação já a mostra na fila.
 * `undefined` enquanto a primeira leitura não volta.
 */
export function useFila(): Fila | undefined {
    const { data: sessao } = useSession();
    const linhas = useAvaliacoesDaFila(sessao?.user.id ?? "");
    return useMemo(() => linhas && filaDasAvaliacoes(linhas), [linhas]);
}
