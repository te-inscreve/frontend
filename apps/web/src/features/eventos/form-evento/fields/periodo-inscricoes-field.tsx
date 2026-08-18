"use client";

import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { CampoPeriodo } from "../campo-periodo";
import { inscricoesFechamDepoisDoInicio } from "../evento-form-schema";

export function PeriodoInscricoesField() {
    const { control, watch } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({
        name: "periodoInscricoes",
        control,
    });
    const inicioEvento = watch("periodoEvento.from");
    const periodoEvento = watch("periodoEvento");
    const periodoInscricoes = watch("periodoInscricoes");
    const avisarInscricoes = inscricoesFechamDepoisDoInicio(
        periodoEvento,
        periodoInscricoes,
    );

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="periodo-inscricoes">
                Período de inscrição
            </FieldLabel>
            <CampoPeriodo
                id="periodo-inscricoes"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalido={fieldState.invalid}
                icone={<TicketIcon />}
                mesInicial={inicioEvento}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            {avisarInscricoes && (
                <p
                    role="status"
                    className="bg-accent text-accent-foreground mt-3.5 flex items-start gap-2 rounded-md px-3 py-2.5 text-xs"
                >
                    <WarningCircleIcon
                        className="text-warning mt-px shrink-0"
                        size={16}
                        weight="fill"
                    />
                    As inscrições fecham depois do evento começar. Revise as
                    datas se não for intencional.
                </p>
            )}
        </Field>
    );
}
