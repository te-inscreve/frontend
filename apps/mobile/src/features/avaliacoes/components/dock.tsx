import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from "react-native-reanimated";
import { ClipboardTextIcon } from "phosphor-react-native/src/icons/ClipboardText";
import { withUniwind } from "uniwind";

import type { Fila } from "../lib/fila";
import type { AvaliacaoLocal } from "~/db/schema";
import { descreverEstadoFila } from "../lib/estado-fila";
import { IconeEstadoFila } from "./icone-estado-fila";

const IconeAvaliacaoAtual = withUniwind(ClipboardTextIcon);

/** A mola das mudanças de tamanho: o badge encolhe com uma pequena sobra. */
const mola = LinearTransition.springify().dampingRatio(0.6);

/**
 * A dock do cabeçalho: os indicadores que dizem, de relance, o que o app está
 * fazendo, cada um num badge escuro próprio sobre a cor primária.
 *
 * - **Avaliação atual**: só aparece quando existe uma, com o nome de quem está
 *   sendo avaliado. Tocar volta à ficha.
 * - **Fila**: o estado do envio ao servidor. Tocar abre o detalhe da fila.
 *   Mostra sempre quantas avaliações ainda não chegaram ao servidor (na fila
 *   e com erro). Sozinha, o texto continua com o estado por extenso depois
 *   do número; ao lado da avaliação atual, que precisa do espaço, fica só o
 *   número. Some até o banco responder, para não
 *   dizer "sincronizado" sem saber.
 *
 * O leitor de tela lê sempre o texto inteiro; os ícones são decorativos.
 */
export function Dock({
    avaliacaoAtual,
    fila,
    aoAbrirAvaliacaoAtual,
    aoAbrirFila,
}: {
    avaliacaoAtual: AvaliacaoLocal | undefined;
    fila: Fila | undefined;
    aoAbrirAvaliacaoAtual: (avaliacao: AvaliacaoLocal) => void;
    aoAbrirFila: () => void;
}) {
    return (
        <View className="shrink flex-row items-center gap-2">
            {avaliacaoAtual && (
                <Badge
                    rotulo={`Avaliação atual: ${avaliacaoAtual.inscricao.concorrente}`}
                    dica="Volta à ficha que está sendo preenchida"
                    icone={
                        <IconeAvaliacaoAtual
                            size={18}
                            weight="bold"
                            colorClassName="accent-primary-foreground"
                        />
                    }
                    texto={avaliacaoAtual.inscricao.concorrente}
                    onPress={() => aoAbrirAvaliacaoAtual(avaliacaoAtual)}
                />
            )}
            {fila && (
                <Badge
                    rotulo={`Estado da fila: ${descreverEstadoFila(fila.estado)}`}
                    dica="Abre o detalhe da fila"
                    icone={
                        <IconeEstadoFila
                            estado={fila.estado}
                            size={18}
                            colorClassName="accent-primary-foreground"
                        />
                    }
                    texto={textoDaFila(fila, !avaliacaoAtual)}
                    onPress={aoAbrirFila}
                />
            )}
        </View>
    );
}

/** Um badge da dock: o ícone e, quando há, o texto ao lado. */
function Badge({
    rotulo,
    dica,
    icone,
    texto,
    onPress,
}: {
    rotulo: string;
    dica: string;
    icone: ReactNode;
    texto: string | null;
    onPress: () => void;
}) {
    return (
        // O fundo fica na view animada: é o quadro dela que a transição de
        // layout interpola. Num filho, ele pularia para o tamanho novo
        // enquanto só a caixa de fora se movesse.
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            layout={mola}
            style={badge}
        >
            <Pressable
                role="button"
                aria-label={rotulo}
                accessibilityHint={dica}
                onPress={onPress}
                // O badge escuro sobre o primário diz "tocável" sem precisar
                // de sublinhado; o `hitSlop` completa o alvo até os 44pt sem
                // crescer o cabeçalho.
                hitSlop={8}
                className="h-9 shrink flex-row items-center gap-1.5 px-3 active:bg-black/10"
            >
                {icone}
                {texto !== null && (
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

/**
 * O texto do badge da fila. Começa sempre pela contagem, para expandir sem
 * mudar o começo: "1" → "1 na fila"; quando o estado não começa pelo mesmo
 * número, ele vem depois de um ponto ("0 · Sincronizado").
 */
function textoDaFila(fila: Fila, porExtenso: boolean) {
    const contagem = String(fila.naFila.length + fila.comErro.length);
    if (!porExtenso) return contagem;
    const estado = descreverEstadoFila(fila.estado);
    return estado.startsWith(`${contagem} `)
        ? estado
        : `${contagem} · ${estado}`;
}

const badge = {
    flexShrink: 1,
    overflow: "hidden",
    borderRadius: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
} as const;
