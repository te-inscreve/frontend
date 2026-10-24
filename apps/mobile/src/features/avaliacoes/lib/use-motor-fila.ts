import { useEffect, useSyncExternalStore } from "react";
import { Alert, AppState } from "react-native";
import * as Network from "expo-network";

import type { EstadoMotor } from "./motor-fila";
import { signOut, useSession } from "~/utils/auth";
import { portasDoAvaliador } from "./envio";
import { MotorFila } from "./motor-fila";

/*
 * O motor da fila do avaliador logado e os gatilhos dele (TE-106): abrir o
 * app, `AppState` → `active`, a conexão voltar e salvar uma avaliação. Um
 * motor por sessão; trocar de avaliador encerra o do anterior.
 */

let motor: MotorFila | null = null;
const ouvintes = new Set<() => void>();
let soltarMotor: (() => void) | null = null;

function trocarMotor(proximo: MotorFila | null) {
    soltarMotor?.();
    motor?.encerrar();
    motor = proximo;
    soltarMotor = proximo?.inscrever(avisar) ?? null;
    avisar();
}

function avisar() {
    for (const ouvinte of ouvintes) ouvinte();
}

const relogio = {
    agora: () => Date.now(),
    agendar(ms: number, fn: () => void) {
        const id = setTimeout(fn, ms);
        return () => clearTimeout(id);
    },
};

function online(estado: Network.NetworkState) {
    // `isInternetReachable` chega depois; enquanto não chega, vale a conexão.
    return !!estado.isConnected && estado.isInternetReachable !== false;
}

/**
 * Liga o motor enquanto há sessão. Montado uma vez, no layout do app logado:
 * a montagem é a abertura a frio (ou o login), e o `active` refaz a sequência.
 */
export function useMotorFila() {
    const { data: sessao } = useSession();
    const avaliadorId = sessao?.user.id;

    useEffect(() => {
        if (!avaliadorId) return;
        const novo = new MotorFila(
            portasDoAvaliador(avaliadorId),
            relogio,
            pedirLogin,
        );
        trocarMotor(novo);

        let cancelado = false;
        void Network.getNetworkStateAsync().then((estado) => {
            if (cancelado) return;
            novo.conexao(online(estado));
            void novo.disparar("abertura");
        });

        const conexao = Network.addNetworkStateListener((estado) =>
            novo.conexao(online(estado)),
        );
        const aplicativo = AppState.addEventListener("change", (estado) => {
            if (estado === "active") void novo.disparar("abertura");
            else if (estado === "background") novo.pausar();
        });

        return () => {
            cancelado = true;
            conexao.remove();
            aplicativo.remove();
            if (motor === novo) trocarMotor(null);
        };
    }, [avaliadorId]);
}

/** O avaliador salvou uma avaliação: ela entrou na fila. */
export function avisarQueSalvou() {
    void motor?.disparar("salvou");
}

/** O estado do motor, ao vivo; `undefined` sem sessão. */
export function useEstadoMotor(): EstadoMotor | undefined {
    return useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => motor?.lerEstado(),
    );
}

/**
 * 401 ou 403: a fila pausa e o app pede login. Sair não apaga nada: as
 * avaliações ficam no aparelho, com o id do avaliador, e voltam a andar
 * quando ele entrar de novo.
 */
function pedirLogin() {
    Alert.alert(
        "Entre de novo para enviar",
        "O servidor não aceitou mais a sua sessão. As avaliações salvas continuam no aparelho e seguem para o servidor quando você entrar de novo.",
        [
            { text: "Agora não", style: "cancel" },
            { text: "Entrar de novo", onPress: () => void signOut() },
        ],
    );
}
