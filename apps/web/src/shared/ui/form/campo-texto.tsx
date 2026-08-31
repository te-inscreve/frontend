"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel, Input } from "@te-inscreve/components";

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    className?: string;
}

/**
 * Input de texto ligado ao formulário do contexto. O tipo do formulário vem
 * por argumento explícito, como em {@link CampoNumero}.
 */
export function CampoTexto<T extends FieldValues>({
    name,
    label,
    placeholder,
    className,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const valor: unknown = field.value;

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
                {...field}
                value={typeof valor === "string" ? valor : ""}
                id={name}
                // `bg-card` e não o transparente do `Input`: nos cartões e
                // nas faixas de categoria o campo precisa se destacar do
                // fundo em vez de sumir nele.
                className="bg-card h-10"
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
