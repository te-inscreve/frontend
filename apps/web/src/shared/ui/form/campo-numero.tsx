"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import { NumberInput } from "~/shared/ui/number-input";

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: React.ReactNode;
    /** Campo que aceita ficar vazio — o vazio vira `null`, não zero. */
    opcional?: boolean;
    ajuda?: string;
    placeholder?: string;
    min?: number;
    className?: string;
}

/**
 * Contador numérico ligado ao formulário do contexto. O valor vazio vira
 * `null` quando o campo é opcional e `NaN` quando é obrigatório — que o Zod
 * recusa com a mensagem do campo.
 *
 * O tipo do formulário vem por argumento explícito (`<CampoNumero<Valores>`),
 * já que `name` sozinho não permite inferi-lo — sem isso os caminhos de campo
 * deixariam de ser verificados.
 */
export function CampoNumero<T extends FieldValues>({
    name,
    label,
    opcional = false,
    ajuda,
    placeholder,
    className,
    min = 0,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const valor =
        typeof field.value === "number" && !Number.isNaN(field.value)
            ? field.value
            : null;

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor={name} className="flex">
                {label}
                {opcional && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                        (opcional)
                    </span>
                )}
            </FieldLabel>
            <NumberInput
                {...field}
                id={name}
                value={valor}
                onChange={(novoValor) =>
                    field.onChange(novoValor ?? (opcional ? null : Number.NaN))
                }
                min={min}
                step={1}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                aria-describedby={ajuda ? `${name}-ajuda` : undefined}
            />
            {ajuda && (
                <p
                    id={`${name}-ajuda`}
                    className="text-muted-foreground text-xs"
                >
                    {ajuda}
                </p>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
