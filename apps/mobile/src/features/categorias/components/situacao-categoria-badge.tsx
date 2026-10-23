import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import {
    ClipboardTextIcon,
    FlagCheckeredIcon,
    LockSimpleIcon,
    XCircleIcon,
} from "phosphor-react-native";
import { withUniwind } from "uniwind";

import type { SituacaoCategoria } from "@te-inscreve/schemas";

import type { BadgeProps } from "~/components/ui/badge";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/utils/cn";

const IconeFechada = withUniwind(LockSimpleIcon);
const IconePronta = withUniwind(ClipboardTextIcon);
const IconeEncerrada = withUniwind(FlagCheckeredIcon);
const IconeCancelada = withUniwind(XCircleIcon);

interface Estilo {
    icone?: ComponentType<IconProps & { colorClassName?: string }>;
    peso?: IconProps["weight"];
    badge: NonNullable<BadgeProps["variant"]>;
    /** O `extra` do web, repartido entre o selo, o texto e o ícone. */
    extra: { selo?: string; texto?: string; icone?: string };
}

/** O visual de cada situação, o mesmo do web; o texto é o `label` da API. */
const ESTILOS: Record<SituacaoCategoria["value"], Estilo> = {
    aberta: {
        badge: "default",
        extra: { texto: "font-bold" },
    },
    fechada: {
        icone: IconeFechada,
        peso: "bold",
        badge: "outline",
        extra: {
            selo: "bg-foreground border-transparent",
            texto: "text-background font-bold",
            icone: "accent-background",
        },
    },
    pronta_avaliacao: {
        icone: IconePronta,
        peso: "bold",
        badge: "outline",
        extra: {
            selo: "border-primary",
            texto: "text-primary font-bold",
            icone: "accent-primary",
        },
    },
    encerrada: {
        icone: IconeEncerrada,
        badge: "secondary",
        extra: {},
    },
    cancelada: {
        icone: IconeCancelada,
        badge: "destructive",
        extra: {},
    },
};

/** A situação da categoria como selo, igual ao `SituacaoCategoriaBadge` do web. */
export function SituacaoCategoriaBadge({
    situacao,
    className,
}: {
    situacao: SituacaoCategoria;
    className?: string;
}) {
    const estilo = ESTILOS[situacao.value];

    return (
        <Badge
            variant={estilo.badge}
            icone={estilo.icone}
            iconePeso={estilo.peso}
            className={cn("gap-2", estilo.extra.selo, className)}
            textClassName={estilo.extra.texto}
            iconeClassName={estilo.extra.icone}
        >
            {situacao.label}
        </Badge>
    );
}
