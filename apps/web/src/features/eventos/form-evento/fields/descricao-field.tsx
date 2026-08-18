"use client";

import { useController, useFormContext } from "react-hook-form";

import {
    Field,
    FieldError,
    FieldLabel,
    Textarea,
} from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";

export function DescricaoField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({
        name: "descricao",
        control,
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
            <Textarea
                {...field}
                id="descricao"
                rows={4}
                className="min-h-22"
                placeholder="Conte o que é o evento, quem promove e o que os participantes podem esperar."
                aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
