import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import Animated from "react-native-reanimated";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { CircleNotchIcon } from "phosphor-react-native/src/icons/CircleNotch";
import { CloudSlashIcon } from "phosphor-react-native/src/icons/CloudSlash";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { withUniwind } from "uniwind";

import type { EstadoFila } from "../lib/estado-fila";

type Icone = ComponentType<IconProps & { colorClassName?: string }>;

const icones: Record<EstadoFila["tipo"], Icone> = {
    sincronizado: withUniwind(CheckCircleIcon),
    sincronizando: withUniwind(CircleNotchIcon),
    pausado: withUniwind(CloudSlashIcon),
    com_erro: withUniwind(WarningIcon),
};

/**
 * O ícone do estado da fila, o mesmo no cabeçalho e no detalhe da fila.
 * Decorativo: quem o usa dá o texto ao leitor de tela.
 */
export function IconeEstadoFila({
    estado,
    size,
    colorClassName,
}: {
    estado: EstadoFila;
    size: number;
    colorClassName: string;
}) {
    const Icone = icones[estado.tipo];

    return (
        // Gira só enquanto envia. A animação CSS do Reanimated roda na thread
        // de UI, sem `useSharedValue` nem efeito.
        <Animated.View
            aria-hidden
            style={estado.tipo === "sincronizando" ? girando : undefined}
        >
            <Icone size={size} weight="bold" colorClassName={colorClassName} />
        </Animated.View>
    );
}

const girando = {
    animationName: { to: { transform: [{ rotate: "360deg" }] } },
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
} as const;
