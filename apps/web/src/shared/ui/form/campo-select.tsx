"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

import {
    Field,
    FieldError,
    FieldLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@te-inscreve/components";

export interface OpcaoSelect {
    valor: string;
    rotulo: string;
}

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: React.ReactNode;
    opcoes: readonly OpcaoSelect[];
    /** Campo que aceita ficar vazio — o vazio é `null`, não a primeira opção. */
    opcional?: boolean;
    ajuda?: string;
    placeholder?: string;
    className?: string;
}

/**
 * Lista fechada ligada ao formulário do contexto, guardada como `string | null`.
 *
 * O `Select` do Radix não representa "nenhum valor" com uma opção — item de
 * valor vazio é proibido —, então o vazio vive só no formulário: o campo abre
 * no placeholder e volta a `null` pelo botão de limpar do rótulo.
 *
 * O tipo do formulário vem por argumento explícito, como em {@link CampoNumero}.
 */
export function CampoSelect<T extends FieldValues>({
    name,
    label,
    opcoes,
    opcional = false,
    ajuda,
    placeholder = "Selecionar",
    className,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const bruto: unknown = field.value;
    const valor = typeof bruto === "string" ? bruto : "";

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor={name} className="flex items-center">
                {label}
                {opcional && (
                    <span className="text-muted-foreground ml-auto text-xs font-normal">
                        (opcional)
                    </span>
                )}
                {opcional && valor && (
                    <button
                        type="button"
                        onClick={() => field.onChange(null)}
                        className="text-muted-foreground hover:text-foreground ml-auto text-xs font-normal underline underline-offset-2"
                    >
                        Limpar
                    </button>
                )}
            </FieldLabel>

            <Select
                value={valor}
                onValueChange={(novo) => field.onChange(novo)}
                name={name}
            >
                <SelectTrigger
                    id={name}
                    ref={(node) => field.ref(node)}
                    onBlur={() => field.onBlur()}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={ajuda ? `${name}-ajuda` : undefined}
                    className="bg-card"
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {opcoes.map((opcao) => (
                        <SelectItem key={opcao.valor} value={opcao.valor}>
                            {opcao.rotulo}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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
