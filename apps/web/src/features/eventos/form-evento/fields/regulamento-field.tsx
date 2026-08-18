"use client";

import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { CampoRegulamento } from "../campo-regulamento";

export function RegulamentoField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({
        name: "regulamento",
        control,
    });

    return (
        <Field className="min-w-55 flex-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="regulamento">Regulamento (PDF)</FieldLabel>
            <CampoRegulamento
                id="regulamento"
                file={field.value}
                onChange={field.onChange}
                invalido={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
