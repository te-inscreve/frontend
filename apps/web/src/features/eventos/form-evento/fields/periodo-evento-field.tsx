"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { CampoPeriodo } from "../campo-periodo";

export function PeriodoEventoField({ className }: { className?: string }) {
    const { control, watch } = useFormContext<EventoFormValues>();
    const periodoInscricoes = watch("periodoInscricoes");
    const { field, fieldState } = useController({
        name: "periodoEvento",
        control,
    });

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor="periodo-evento" id="periodo-evento-rotulo">
                Período de ocorrência do evento
            </FieldLabel>
            <CampoPeriodo
                id="periodo-evento"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalido={fieldState.invalid}
                icone={<CalendarDotsIcon />}
                referencia={{
                    periodo: periodoInscricoes,
                    rotulo: "Inscrições",
                }}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
