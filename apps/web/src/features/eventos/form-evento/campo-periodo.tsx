"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    Button,
    Calendar,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { Periodo } from "./evento-form-schema";
import { useDateRangeFormatter } from "~/shared/utils/format-date";

/** "Agosto de 2026" — o padrão do react-day-picker sai como "agosto 2026". */
function legendaDoMes(mes: Date) {
    const legenda = format(mes, "MMMM 'de' yyyy", { locale: ptBR });
    return legenda.charAt(0).toUpperCase() + legenda.slice(1);
}

interface CampoPeriodoProps {
    id: string;
    value: Periodo;
    onChange: (periodo: Periodo) => void;
    onBlur?: () => void;
    /** Ícone à esquerda do gatilho: calendário no evento, ticket nas inscrições. */
    icone: React.ReactNode;
    invalido?: boolean;
    /** Primeiro mês exibido quando ainda não há data escolhida. */
    mesInicial?: Date;
}

export function CampoPeriodo({
    id,
    value,
    onChange,
    onBlur,
    icone,
    invalido,
    mesInicial,
}: CampoPeriodoProps) {
    const [aberto, setAberto] = useState(false);
    const { formatDateRange } = useDateRangeFormatter();

    const rotulo =
        value.from && value.to
            ? formatDateRange(value.from, value.to)
            : "Selecionar datas";

    return (
        <Popover
            open={aberto}
            onOpenChange={(proximo) => {
                setAberto(proximo);
                if (!proximo) onBlur?.();
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    aria-invalid={invalido}
                    className={cn(
                        "h-10 w-full max-w-sm justify-start gap-2.5 px-3 font-normal",
                        !value.to && "text-muted-foreground",
                    )}
                >
                    <span className="text-primary flex items-center">
                        {icone}
                    </span>
                    {rotulo}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    autoFocus
                    mode="range"
                    locale={ptBR}
                    formatters={{ formatCaption: legendaDoMes }}
                    defaultMonth={value.from ?? mesInicial}
                    selected={value}
                    onSelect={(intervalo) =>
                        onChange({ from: intervalo?.from, to: intervalo?.to })
                    }
                />

                <div className="flex items-center justify-between gap-4 border-t px-3 py-2.5">
                    <span className="text-muted-foreground text-xs">
                        {rotulo}
                    </span>
                    <Button
                        type="button"
                        size="xs"
                        onClick={() => setAberto(false)}
                    >
                        Aplicar
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
