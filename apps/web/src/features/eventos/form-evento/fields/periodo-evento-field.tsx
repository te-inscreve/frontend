"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { CampoPeriodo } from "../campo-periodo";

export function PeriodoEventoField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({
        name: "periodoEvento",
        control,
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="periodo-evento">
                Período de ocorrência do evento
            </FieldLabel>
            <CampoPeriodo
                id="periodo-evento"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalido={fieldState.invalid}
                icone={<CalendarDotsIcon />}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
