"use client";

import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { CampoPeriodo } from "../campo-periodo";

export function PeriodoInscricoesField({ className }: { className?: string }) {
    const { control, watch } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({
        name: "periodoInscricoes",
        control,
    });
    const inicioEvento = watch("periodoEvento.from");

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel
                htmlFor="periodo-inscricoes"
                id="periodo-inscricoes-rotulo"
            >
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
        </Field>
    );
}
