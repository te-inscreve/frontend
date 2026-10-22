import { Pressable, Text } from "react-native";

import type { EstadoFila } from "../lib/estado-fila";
import { descreverEstadoFila } from "../lib/estado-fila";
import { IconeEstadoFila } from "./icone-estado-fila";

/**
 * O estado da fila em ícone e texto, sobre a cor primária do cabeçalho. Tocar
 * abre o detalhe da fila.
 *
 * Lê como um botão só para o leitor de tela; o ícone é decorativo.
 */
export function IndicadorFila({
    estado,
    onPress,
}: {
    estado: EstadoFila;
    onPress: () => void;
}) {
    const texto = descreverEstadoFila(estado);

    return (
        <Pressable
            role="button"
            aria-label={`Estado da fila: ${texto}`}
            accessibilityHint="Abre o detalhe da fila"
            onPress={onPress}
            // O texto tem só a altura da linha; o `hitSlop` leva o alvo de
            // toque aos 44pt sem crescer o cabeçalho.
            hitSlop={12}
            className="shrink flex-row items-center gap-1.5 active:opacity-70"
        >
            <IconeEstadoFila
                estado={estado}
                size={18}
                colorClassName="accent-primary-foreground"
            />
            <Text
                numberOfLines={1}
                className="text-primary-foreground shrink text-sm font-medium"
            >
                {texto}
            </Text>
        </Pressable>
    );
}
