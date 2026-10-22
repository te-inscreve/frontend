import type {
    EntryAnimationsValues,
    ExitAnimationsValues,
    SharedValue,
} from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";

/*
 * O deslize entre etapas, com as layout animations do Reanimated — sem lib
 * nova (`docs/pesquisas/animacao-etapas-mobile.md`).
 *
 * A direção vem de um shared value, não de `entering`/`exiting` escolhidos no
 * render: a etapa que sai desmonta com o `exiting` do último render em que
 * existiu, então um preset de "avançar" fixado ali erraria a volta. O worklet
 * lê a direção na hora em que a animação começa.
 *
 * Com "reduzir movimento" ligado no sistema, o `withTiming` vai direto ao
 * valor final e a troca fica instantânea (`ReduceMotion.System` é o padrão).
 */

/** `1` avança (a nova entra pela direita); `-1` volta (entra pela esquerda). */
export type DirecaoEtapa = 1 | -1;

const DURACAO = 250;

export function entradaDaEtapa(direcao: SharedValue<DirecaoEtapa>) {
    return (valores: EntryAnimationsValues) => {
        "worklet";
        return {
            initialValues: {
                originX:
                    valores.targetOriginX + direcao.value * valores.windowWidth,
            },
            animations: {
                originX: withTiming(valores.targetOriginX, {
                    duration: DURACAO,
                }),
            },
        };
    };
}

export function saidaDaEtapa(direcao: SharedValue<DirecaoEtapa>) {
    return (valores: ExitAnimationsValues) => {
        "worklet";
        return {
            initialValues: { originX: valores.currentOriginX },
            animations: {
                originX: withTiming(
                    valores.currentOriginX -
                        direcao.value * valores.windowWidth,
                    { duration: DURACAO },
                ),
            },
        };
    };
}
