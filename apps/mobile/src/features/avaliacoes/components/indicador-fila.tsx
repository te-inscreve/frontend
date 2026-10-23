import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import type { EstadoFila } from "../lib/estado-fila";
import { descreverEstadoFila } from "../lib/estado-fila";
import { IconeEstadoFila } from "./icone-estado-fila";

/** Quanto tempo o texto fica à vista depois de o estado mudar. */
const TEXTO_VISIVEL_MS = 3000;

/**
 * O estado da fila sobre a cor primária do cabeçalho. Tocar abre o detalhe da
 * fila.
 *
 * O texto só aparece quando o estado muda — e na abertura do app —, e some
 * depois de alguns segundos: a pílula encolhe com uma pequena sobra de mola até
 * ficar só o ícone. Quem quer o detalhe toca.
 *
 * Lê como um botão só para o leitor de tela, sempre com o texto inteiro; o
 * ícone é decorativo.
 */
export function IndicadorFila({
    estado,
    onPress,
}: {
    estado: EstadoFila;
    onPress: () => void;
}) {
    const texto = descreverEstadoFila(estado);
    const [tipoAnterior, setTipoAnterior] = useState(estado.tipo);
    const [mostrarTexto, setMostrarTexto] = useState(true);

    // Mudou o estado: o texto volta já neste render, sem esperar um efeito.
    // Só o tipo conta — o "Enviando 2 de 3" que avança não reabre a pílula.
    if (estado.tipo !== tipoAnterior) {
        setTipoAnterior(estado.tipo);
        setMostrarTexto(true);
    }

    // O `estado.tipo` nas dependências reinicia a contagem a cada mudança, e
    // não só na primeira.
    useEffect(() => {
        if (!mostrarTexto) return;
        const timer = setTimeout(
            () => setMostrarTexto(false),
            TEXTO_VISIVEL_MS,
        );
        return () => clearTimeout(timer);
    }, [mostrarTexto, estado.tipo]);

    return (
        // O fundo da pílula fica na view animada: é o quadro dela que a
        // transição de layout interpola. Num filho, ele pularia para o
        // tamanho novo enquanto só a caixa de fora se movesse.
        <Animated.View
            layout={LinearTransition.springify().dampingRatio(0.6)}
            style={pilula}
        >
            <Pressable
                role="button"
                aria-label={`Estado da fila: ${texto}`}
                accessibilityHint="Abre o detalhe da fila"
                onPress={onPress}
                // A pílula escura sobre o primário diz "tocável" sem precisar
                // de sublinhado; o `hitSlop` completa o alvo até os 44pt sem
                // crescer o cabeçalho.
                hitSlop={8}
                className="shrink flex-row items-center gap-1.5 px-3 py-1.5 active:bg-black/10"
            >
                <IconeEstadoFila
                    estado={estado}
                    size={18}
                    colorClassName="accent-primary-foreground"
                />
                {mostrarTexto && (
                    <Animated.View
                        entering={FadeIn.delay(120)}
                        style={{ flexShrink: 1 }}
                    >
                        <Text
                            numberOfLines={1}
                            className="text-primary-foreground text-sm font-medium"
                        >
                            {texto}
                        </Text>
                    </Animated.View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const pilula = {
    flexShrink: 1,
    overflow: "hidden",
    borderRadius: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
} as const;
