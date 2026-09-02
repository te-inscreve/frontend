"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useState } from "react";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useController, useFormContext } from "react-hook-form";

import {
    Button,
    Calendar,
    Field,
    FieldError,
    FieldLabel,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

/** "Agosto de 2026" — o padrão do react-day-picker sai como "agosto 2026". */
function legendaDoMes(mes: Date) {
    const legenda = format(mes, "MMMM 'de' yyyy", { locale: ptBR });
    return legenda.charAt(0).toUpperCase() + legenda.slice(1);
}

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: React.ReactNode;
    /** Campo que aceita ficar vazio — o vazio é `null`, e não uma data qualquer. */
    opcional?: boolean;
    ajuda?: string;
    placeholder?: string;
    className?: string;
    /** Primeiro mês exibido quando ainda não há data escolhida. */
    mesInicial?: Date;
    /** Datas fora do intervalo ficam desabilitadas no calendário. */
    dataMinima?: Date;
    dataMaxima?: Date;
}

/**
 * Data única ligada ao formulário do contexto, guardada como `Date | null`.
 *
 * Calendário e não campo de texto com máscara: as datas daqui — nascimento,
 * validade, filiação — são escolhidas, não digitadas de cabeça, e o calendário
 * dispensa validar formato.
 *
 * O tipo do formulário vem por argumento explícito, como em {@link CampoNumero}.
 */
export function CampoData<T extends FieldValues>({
    name,
    label,
    opcional = false,
    ajuda,
    placeholder = "Selecionar data",
    className,
    mesInicial,
    dataMinima,
    dataMaxima,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });
    const [aberto, setAberto] = useState(false);

    const bruto: unknown = field.value;
    const valor = bruto instanceof Date ? bruto : null;

    // Um matcher por limite: `{ before: undefined }` não é "sem limite" para o
    // react-day-picker, é um intervalo aberto que ele tenta interpretar.
    const foraDoIntervalo: ({ before: Date } | { after: Date })[] = [];
    if (dataMinima) foraDoIntervalo.push({ before: dataMinima });
    if (dataMaxima) foraDoIntervalo.push({ after: dataMaxima });

    return (
        <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor={name} className="flex w-full">
                {label}
                {opcional && (
                    <span className="text-muted-foreground ml-auto text-xs font-normal">
                        (opcional)
                    </span>
                )}
            </FieldLabel>

            <Popover
                open={aberto}
                onOpenChange={(proximo) => {
                    setAberto(proximo);
                    if (!proximo) field.onBlur();
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        type="button"
                        variant="outline"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={ajuda ? `${name}-ajuda` : undefined}
                        className={cn(
                            "bg-card h-10 w-full justify-start gap-2.5 px-3 font-normal",
                            !valor && "text-muted-foreground",
                        )}
                    >
                        <span className="text-primary flex items-center">
                            <CalendarDotsIcon aria-hidden="true" />
                        </span>
                        {valor
                            ? format(valor, "dd/MM/yyyy", { locale: ptBR })
                            : placeholder}
                    </Button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                        autoFocus
                        mode="single"
                        locale={ptBR}
                        captionLayout="dropdown"
                        formatters={{ formatCaption: legendaDoMes }}
                        defaultMonth={valor ?? mesInicial}
                        startMonth={dataMinima}
                        endMonth={dataMaxima}
                        disabled={foraDoIntervalo}
                        selected={valor ?? undefined}
                        onSelect={(data) => {
                            field.onChange(data ?? null);
                            if (data) setAberto(false);
                        }}
                    />
                </PopoverContent>
            </Popover>

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
