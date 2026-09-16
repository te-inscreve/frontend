"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useState } from "react";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useController, useFormContext } from "react-hook-form";

import {
    Button,
    Calendar,
    Field,
    FieldError,
    FieldLabel,
} from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

/** "12 de março de 1998" — sem ambiguidade entre dia e mês, ao contrário de `12/03`. */
function porExtenso(data: Date) {
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/** Um atalho acima do calendário: o que o botão diz e a data que ele escolhe. */
export interface PresetData {
    rotulo: string;
    /**
     * A data, como função e não como constante: prazos como "1 ano" contam a
     * partir de hoje, e a tela pode ficar aberta atravessando a meia-noite.
     */
    data: () => Date;
}

interface Props<T extends FieldValues> {
    name: FieldPath<T>;
    label: React.ReactNode;
    /** Campo que aceita ficar vazio — o vazio é `null`, e não uma data qualquer. */
    opcional?: boolean;
    ajuda?: string;
    className?: string;
    /** Primeiro mês exibido quando ainda não há data escolhida. */
    mesInicial?: Date;
    /**
     * Datas fora do intervalo ficam desabilitadas, e é ele também que enche os
     * seletores de mês e ano do cabeçalho. Vale a pena informar os dois lados:
     * sem `dataMaxima`, o react-day-picker para a navegação no fim do ano
     * corrente e nenhuma data do ano que vem fica alcançável.
     */
    dataMinima?: Date;
    dataMaxima?: Date;
    /** Atalhos abaixo do calendário. Vazio quando não há prazo típico. */
    presets?: PresetData[];
    /** O que os atalhos são, dito antes deles. Ex.: "Vale por". */
    presetsLabel?: React.ReactNode;
}

/**
 * Data única ligada ao formulário do contexto, guardada como `Date | null`.
 *
 * Calendário e não campo de texto com máscara: as datas daqui — nascimento,
 * validade, filiação — são escolhidas, não digitadas de cabeça, e o calendário
 * dispensa validar formato.
 *
 * E calendário aberto, não escondido atrás de um botão que abre popover: o
 * formulário já vive dentro de um diálogo, e popover sobre modal empilhava
 * duas camadas para uma escolha só — clicar, esperar abrir, escolher, ver
 * fechar. Aberto, a escolha custa um clique e o mês fica à vista enquanto o
 * resto do formulário é preenchido.
 *
 * O tipo do formulário vem por argumento explícito, como em {@link CampoNumero}.
 */
export function CampoData<T extends FieldValues>({
    name,
    label,
    opcional = false,
    ajuda,
    className,
    mesInicial,
    dataMinima,
    dataMaxima,
    presets = [],
    presetsLabel,
}: Props<T>) {
    const { control } = useFormContext<T>();
    const { field, fieldState } = useController({ name, control });

    const bruto: unknown = field.value;
    const valor = bruto instanceof Date ? bruto : null;

    // O mês à vista é estado daqui porque os presets saltam um ano de uma vez:
    // sem levar o calendário junto, o dia recém-escolhido ficaria fora da tela
    // e o clique pareceria não ter feito nada.
    const [mes, setMes] = useState(() => valor ?? mesInicial ?? new Date());

    const escolher = (data: Date | null) => {
        field.onChange(data);
        field.onBlur();
        if (data) setMes(data);
    };

    // Um matcher por limite: `{ before: undefined }` não é "sem limite" para o
    // react-day-picker, é um intervalo aberto que ele tenta interpretar.
    const foraDoIntervalo: ({ before: Date } | { after: Date })[] = [];
    if (dataMinima) foraDoIntervalo.push({ before: dataMinima });
    if (dataMaxima) foraDoIntervalo.push({ after: dataMaxima });

    return (
        <Field
            data-invalid={fieldState.invalid}
            // O grupo é rotulado por referência, e não por um `<label for>`: o
            // calendário é uma grade de botões, e não há um controle único a
            // que o rótulo possa apontar.
            aria-labelledby={`${name}-label`}
            aria-describedby={ajuda ? `${name}-ajuda` : undefined}
            className={className}
        >
            <FieldLabel id={`${name}-label`} className="flex w-full">
                {label}
                {opcional && (
                    <span className="text-muted-foreground ml-auto text-xs font-normal">
                        (opcional)
                    </span>
                )}
            </FieldLabel>

            <div className="bg-card group-data-[invalid=true]/field:border-destructive flex flex-col overflow-hidden rounded-lg border">
                {/* A data escolhida por extenso. O calendário marca o dia, mas
                    quem rolou até outro mês perde de vista o que escolheu. */}
                <div className="flex min-h-11 items-center gap-2 border-b px-3 py-2">
                    <CalendarDotsIcon
                        aria-hidden="true"
                        className="text-primary shrink-0"
                    />
                    <span
                        className={cn(
                            "truncate text-sm font-medium",
                            !valor && "text-muted-foreground font-normal",
                        )}
                    >
                        {valor ? porExtenso(valor) : "Nenhuma data escolhida"}
                    </span>
                    {opcional && valor && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="ml-auto shrink-0"
                            onClick={() => escolher(null)}
                        >
                            <XIcon aria-hidden="true" />
                            Limpar
                        </Button>
                    )}
                </div>

                <Calendar
                    mode="single"
                    // Nascimento e validade ficam longe do mês corrente: a
                    // legenda clicável abre a grade de meses e a de anos, e
                    // tira a viagem de dezenas de cliques nas setas.
                    captionLayout="dropdown"
                    month={mes}
                    onMonthChange={setMes}
                    startMonth={dataMinima}
                    endMonth={dataMaxima}
                    disabled={foraDoIntervalo}
                    selected={valor ?? undefined}
                    onSelect={(data) => escolher(data ?? null)}
                    // A caixa em volta já é o fundo do campo; o calendário
                    // ocupa a largura dela em vez do próprio `w-fit`, ou
                    // sobraria uma moldura larga em torno de uma grade estreita.
                    className="bg-transparent"
                    classNames={{ root: "w-full" }}
                />

                {/* Os atalhos ficam embaixo, e não entre o cabeçalho e a grade:
                    ali eles empurrariam o calendário para baixo, e dois campos
                    de data lado a lado — um com atalhos, outro sem — sairiam
                    com as grades desalinhadas. */}
                {presets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t px-3 py-2">
                        {presetsLabel && (
                            <span className="text-muted-foreground mr-0.5 text-xs">
                                {presetsLabel}
                            </span>
                        )}
                        {presets.map((preset) => {
                            const data = preset.data();
                            const escolhido =
                                valor !== null && isSameDay(valor, data);

                            return (
                                <Button
                                    key={preset.rotulo}
                                    type="button"
                                    size="xs"
                                    variant={escolhido ? "default" : "outline"}
                                    // `aria-pressed`, e não `aria-selected`: o
                                    // atalho continua sendo um botão que liga e
                                    // desliga a data que ele propõe.
                                    aria-pressed={escolhido}
                                    onClick={() => escolher(data)}
                                >
                                    {preset.rotulo}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>

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
