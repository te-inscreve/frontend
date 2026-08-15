"use client";

import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel, Input } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";

export function NomeField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({ name: "nome", control });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="nome">Nome do evento</FieldLabel>
            <Input
                {...field}
                id="nome"
                className="h-10"
                placeholder="Ex.: Festival de Dança 2024"
                aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
