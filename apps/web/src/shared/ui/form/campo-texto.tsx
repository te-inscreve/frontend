"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel, Input } from "@te-inscreve/components";

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label?: string;
    placeholder?: string;
    className?: string;
    helpText?: string;
    /**
     * Reescreve o que foi digitado antes de guardar — é assim que CNPJ e
     * telefone ganham máscara sem cada formulário refazer o `onChange`.
     */
    mask?: (valor: string) => string;
    inputMode?: React.ComponentProps<typeof Input>["inputMode"];
    /** `time` dá o seletor de horário nativo, que já devolve `HH:mm`. */
    type?: "text" | "time";
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
    helpText,
    mask,
    inputMode,
    type = "text",
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const valor: unknown = field.value;

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            <Input
                {...field}
                value={typeof valor === "string" ? valor : ""}
                onChange={(evento) =>
                    field.onChange(
                        mask ? mask(evento.target.value) : evento.target.value,
                    )
                }
                id={name}
                type={type}
                inputMode={inputMode}
                // `bg-card` e não o transparente do `Input`: nos cartões e
                // nas faixas de categoria o campo precisa se destacar do
                // fundo em vez de sumir nele.
                className="bg-card h-10"
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
