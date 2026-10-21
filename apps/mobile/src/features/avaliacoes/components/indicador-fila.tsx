import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { CircleNotchIcon } from "phosphor-react-native/src/icons/CircleNotch";
import { CloudSlashIcon } from "phosphor-react-native/src/icons/CloudSlash";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { withUniwind } from "uniwind";

import type { EstadoFila } from "../lib/estado-fila";
import { descreverEstadoFila } from "../lib/estado-fila";

type Icone = ComponentType<IconProps & { colorClassName?: string }>;

const icones: Record<EstadoFila["tipo"], Icone> = {
    sincronizado: withUniwind(CheckCircleIcon),
    sincronizando: withUniwind(CircleNotchIcon),
    pausado: withUniwind(CloudSlashIcon),
    com_erro: withUniwind(WarningIcon),
};

/**
 * O estado da fila em ícone e texto, sobre a cor primária do cabeçalho.
 *
 * Lê como um bloco só para o leitor de tela; o ícone é decorativo.
 */
export function IndicadorFila({ estado }: { estado: EstadoFila }) {
    const Icone = icones[estado.tipo];
    const texto = descreverEstadoFila(estado);

    return (
        <View
            accessible
            aria-label={`Estado da fila: ${texto}`}
            className="shrink flex-row items-center gap-1.5"
        >
            {/*
             * Gira só enquanto envia. A animação CSS do Reanimated roda na
             * thread de UI, sem `useSharedValue` nem efeito.
             */}
            <Animated.View
                style={estado.tipo === "sincronizando" ? girando : undefined}
            >
                <Icone
                    size={18}
                    weight="bold"
                    colorClassName="accent-primary-foreground"
                />
            </Animated.View>
            <Text
                numberOfLines={1}
                className="text-primary-foreground shrink text-sm font-medium"
            >
                {texto}
            </Text>
        </View>
    );
}

const girando = {
    animationName: { to: { transform: [{ rotate: "360deg" }] } },
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
} as const;
