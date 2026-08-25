"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel, Input } from "@te-inscreve/components";

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
}

/**
 * Input de texto ligado ao formulário do contexto. O tipo do formulário vem
 * por argumento explícito, como em {@link CampoNumero}.
 */
export function CampoTexto<T extends FieldValues>({
    name,
    label,
    placeholder,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const valor: unknown = field.value;

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
                {...field}
                value={typeof valor === "string" ? valor : ""}
                id={name}
                className="h-10"
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
