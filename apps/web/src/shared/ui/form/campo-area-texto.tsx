"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import {
    Field,
    FieldError,
    FieldLabel,
    Textarea,
} from "@te-inscreve/components";

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label?: string;
    placeholder?: string;
    className?: string;
    helpText?: string;
    /** Altura inicial em linhas. A caixa cresce com o texto a partir daí. */
    rows?: number;
}

/**
 * Área de texto ligada ao formulário do contexto — o {@link CampoTexto} de
 * quem escreve mais de uma linha.
 *
 * O `Textarea` compartilhado já cresce com o conteúdo (`field-sizing-content`),
 * então `rows` é só o tamanho de partida.
 */
export function CampoAreaTexto<T extends FieldValues>({
    name,
    label,
    placeholder,
    className,
    helpText,
    rows = 3,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const valor: unknown = field.value;

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            <Textarea
                {...field}
                value={typeof valor === "string" ? valor : ""}
                id={name}
                rows={rows}
                // `bg-card` pelo mesmo motivo do campo de texto: dentro de um
                // cartão, o transparente do primitivo sumiria no fundo.
                className="bg-card"
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
            />
            {helpText && (
                <p className="text-muted-foreground text-xs">{helpText}</p>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
