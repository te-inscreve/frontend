import type { NetworkState } from "expo-network";

/**
 * Se o aparelho alcança a internet. O `isInternetReachable` chega depois do
 * `isConnected`; enquanto não chega, vale a conexão.
 */
export function estaOnline(estado: NetworkState) {
    return !!estado.isConnected && estado.isInternetReachable !== false;
}

/** Cancela a chamada que passa de `ms`: a falha vira um erro como outro. */
export async function comTempoMaximo<T>(
    ms: number,
    chamada: (signal: AbortSignal) => Promise<T>,
) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), ms);
    try {
        return await chamada(controle.signal);
    } finally {
        clearTimeout(relogio);
    }
}
