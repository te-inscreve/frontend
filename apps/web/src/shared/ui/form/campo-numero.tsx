"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel, Input } from "@te-inscreve/components";

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: string;
    /** Campo que aceita ficar vazio — o vazio vira `null`, não zero. */
    opcional?: boolean;
    ajuda?: string;
    placeholder?: string;
    min?: number;
}

/**
 * Input numérico ligado ao formulário do contexto. O `<input type="number">`
 * sempre devolve string, e é aqui que ela vira o que o schema espera: `null`
 * quando o campo é opcional e está vazio, `NaN` quando é obrigatório e está
 * vazio — que o Zod recusa com a mensagem do campo.
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
    min = 0,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const valor: unknown = field.value;
    const texto =
        typeof valor === "number" && !Number.isNaN(valor) ? String(valor) : "";

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>
                {label}
                {opcional && (
                    <span className="text-muted-foreground text-xs font-normal">
                        (opcional)
                    </span>
                )}
            </FieldLabel>
            <Input
                {...field}
                id={name}
                value={texto}
                onChange={(evento) => {
                    const bruto = evento.target.value;
                    if (bruto === "") {
                        field.onChange(opcional ? null : Number.NaN);
                        return;
                    }
                    field.onChange(Number(bruto));
                }}
                type="number"
                inputMode="numeric"
                min={min}
                step={1}
                className="h-10"
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
