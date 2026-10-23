"use client";

import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { useFormContext } from "react-hook-form";

import type { EventoFormValues } from "../evento-form-schema";
import { inscricoesFechamDepoisDoInicio } from "../evento-form-schema";

/**
 * Aviso sobre os dois períodos juntos, e por isso abaixo dos dois: preso a um
 * só campo, ele ficaria espremido na coluna dele e desalinharia as caixas.
 */
export function AvisoPeriodos() {
    const { watch } = useFormContext<EventoFormValues>();
    const periodoEvento = watch("periodoEvento");
    const periodoInscricoes = watch("periodoInscricoes");

    if (!inscricoesFechamDepoisDoInicio(periodoEvento, periodoInscricoes)) {
        return null;
    }

    return (
        <p
            role="status"
            // Uma linha só para ele, embaixo dos dois campos.
            className="bg-accent text-accent-foreground flex basis-full items-start gap-2 rounded-md px-3 py-2.5 text-xs"
        >
            <WarningCircleIcon
                className="text-warning mt-px shrink-0"
                size={16}
                weight="fill"
            />
            As inscrições fecham depois do evento começar. Revise as datas se
            não for intencional.
        </p>
    );
}
