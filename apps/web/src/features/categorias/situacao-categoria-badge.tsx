import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/ssr/FlagCheckered";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr/XCircle";

import type { SituacaoCategoria } from "@te-inscreve/schemas";
import { Badge, cn } from "@te-inscreve/components";

interface Estilo {
    icone: React.ReactNode;
    badge: "default" | "secondary" | "outline" | "destructive";
    extra: string;
}

/** O visual de cada situação; o texto é o `label` que a API devolve. */
const ESTILOS: Record<SituacaoCategoria["value"], Estilo> = {
    aberta: {
        icone: undefined,
        badge: "default",
        extra: "font-bold",
    },
    fechada: {
        icone: <LockSimpleIcon aria-hidden="true" weight="bold" />,
        badge: "outline",
        extra: "text-background bg-foreground border-warning border-transparent font-bold",
    },
    encerrada: {
        icone: <FlagCheckeredIcon aria-hidden="true" />,
        badge: "secondary",
        extra: "",
    },
    cancelada: {
        icone: <XCircleIcon aria-hidden="true" />,
        badge: "destructive",
        extra: "",
    },
};

/**
 * A situação da categoria como selo — o mesmo no cartão da fila da modalidade
 * e no cabeçalho do detalhe.
 */
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
            className={cn("shrink-0 gap-2", estilo.extra, className)}
        >
            {estilo.icone}
            {situacao.label}
        </Badge>
    );
}
