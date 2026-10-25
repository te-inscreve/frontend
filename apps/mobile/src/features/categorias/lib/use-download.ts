import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";

import { useSession } from "~/utils/auth";
import { estaOnline } from "~/utils/rede";
import { baixarCategorias } from "./download";
import { portasDoDownload } from "./download-local";

/*
 * Quando o download offline roda (TE-107): ao abrir o app com sessão, ao
 * voltar para a frente, quando a conexão volta e no pull-to-refresh. Baixa
 * todas as categorias prontas de uma vez: no evento, o avaliador pode
 * precisar de uma que nunca abriu.
 */

/** O que o download está fazendo, para as telas. */
export interface EstadoDownload {
    baixando: boolean;
    /** O último download falhou por inteiro: a lista não veio. */
    falhou: boolean;
    /** Categorias cujo último download falhou; ficam com o anterior. */
    falharam: number[];
    /** Quando o último download deu certo, em ms. */
    ultimoEm: number | null;
}

/** Abaixo disso, voltar para a frente não baixa de novo. */
const INTERVALO_MINIMO_MS = 5 * 60_000;

let estado: EstadoDownload = {
    baixando: false,
    falhou: false,
    falharam: [],
    ultimoEm: null,
};
let emCurso: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function mudar(parcial: Partial<EstadoDownload>) {
    estado = { ...estado, ...parcial };
    for (const ouvinte of ouvintes) ouvinte();
}

/**
 * Baixa tudo de novo; com um download em curso, espera o dele. É o
 * pull-to-refresh das telas.
 */
export function atualizarDownload(): Promise<void> {
    emCurso ??= (async () => {
        mudar({ baixando: true });
        const resultado = await baixarCategorias(portasDoDownload).catch(
            () => ({ ok: false }) as const,
        );
        mudar(
            resultado.ok
                ? {
                      baixando: false,
                      falhou: false,
                      falharam: resultado.falharam,
                      ultimoEm: Date.now(),
                  }
                : { baixando: false, falhou: true },
        );
    })().finally(() => {
        emCurso = null;
    });
    return emCurso;
}

/** Baixa se o último download é antigo, ou se nunca deu certo. */
function atualizarSeAntigo() {
    if (
        estado.ultimoEm === null ||
        Date.now() - estado.ultimoEm > INTERVALO_MINIMO_MS
    )
        void atualizarDownload();
}

/**
 * O pull-to-refresh das telas que leem o download: só o puxar mostra o
 * indicador; o download sozinho não mexe na lista.
 */
export function usePuxarDownload() {
    const [puxando, setPuxando] = useState(false);
    function puxar() {
        setPuxando(true);
        void atualizarDownload().finally(() => setPuxando(false));
    }
    return { puxando, puxar };
}

/** O estado do download, ao vivo. */
export function useEstadoDownload() {
    return useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => estado,
    );
}

/**
 * Liga os gatilhos enquanto há sessão. Montado uma vez, no layout do app
 * logado, ao lado do envio da fila.
 */
export function useDownloadOffline() {
    const { data: sessao } = useSession();
    const logado = !!sessao;

    useEffect(() => {
        if (!logado) return;
        // Sem rede a lista falharia: o download espera a conexão voltar.
        let online: boolean | undefined;
        void Network.getNetworkStateAsync().then((rede) => {
            online ??= estaOnline(rede);
            if (online) void atualizarDownload();
        });

        const conexao = Network.addNetworkStateListener((rede) => {
            const agora = estaOnline(rede);
            // A conexão voltou: o que falhou sem ela tenta de novo na hora.
            if (agora && online === false) {
                if (estado.falhou || estado.falharam.length > 0)
                    void atualizarDownload();
                else atualizarSeAntigo();
            }
            online = agora;
        });
        const aplicativo = AppState.addEventListener("change", (proximo) => {
            if (proximo === "active") atualizarSeAntigo();
        });
        return () => {
            conexao.remove();
            aplicativo.remove();
        };
    }, [logado]);
}
