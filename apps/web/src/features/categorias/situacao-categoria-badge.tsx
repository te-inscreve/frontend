import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/ssr/FlagCheckered";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
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
        icone: <TicketIcon aria-hidden="true" weight="bold" />,
        badge: "outline",
        extra: "text-warning-foreground bg-warning border-warning border-transparent font-bold",
    },
    fechada: {
        icone: <CheckIcon aria-hidden="true" weight="bold" />,
        badge: "default",
        extra: "font-bold",
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
