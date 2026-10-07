"use client";

import { useRef, useState } from "react";
import { format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Calendar } from "@te-inscreve/components";

import type { Periodo } from "./evento-form-schema";
import { GavetaCalendario } from "~/shared/ui/form/gaveta-calendario";
import { useDateRangeFormatter } from "~/shared/utils/format-date";

interface CampoPeriodoProps {
    /** `id` do gatilho; o rótulo do campo deve ter `${id}-rotulo`. */
    id: string;
    value: Periodo;
    onChange: (periodo: Periodo) => void;
    onBlur?: () => void;
    /** Ícone à esquerda do gatilho: calendário no evento, ticket nas inscrições. */
    icone: React.ReactNode;
    invalido?: boolean;
    /** Primeiro mês exibido quando ainda não há data escolhida. */
    mesInicial?: Date;
    /**
     * Outro período pintado ao fundo da grade, como referência: o evento é
     * escolhido vendo quando as inscrições abrem e fecham. Só aparece completo.
     */
    referencia?: { periodo: Periodo; rotulo: string };
}

/**
 * Período de datas numa gaveta que desce e sobe pelo gatilho. Ela não sobe
 * sozinha ao completar o período: aqui os dois períodos são escolhidos um de
 * olho no outro, e quem acerta as datas costuma reajustar mais de uma vez.
 *
 * A escolha é em dois cliques contados a partir da abertura — o primeiro marca
 * o início, o segundo o fim —, e não pelo valor que o react-day-picker devolve:
 * ele fecha o intervalo já no primeiro clique (`from` e `to` no mesmo dia), e
 * não haveria como saber se o evento é de um dia só ou se ainda falta o fim.
 * Dois cliques no mesmo dia são o evento de um dia.
 */
export function CampoPeriodo({
    id,
    value,
    onChange,
    onBlur,
    icone,
    invalido,
    mesInicial,
    referencia,
}: CampoPeriodoProps) {
    const [aberto, setAberto] = useState(false);
    const [esperandoFim, setEsperandoFim] = useState(false);
    const gatilho = useRef<HTMLButtonElement>(null);
    const { formatDateRange } = useDateRangeFormatter();

    const alternar = (proximo: boolean) => {
        setAberto(proximo);
        // Reabrir recomeça pelo início: o período anterior continua marcado
        // na grade, e o próximo clique propõe um novo.
        setEsperandoFim(false);
        if (!proximo) onBlur?.();
    };

    const escolherDia = (dia: Date) => {
        if (!esperandoFim || !value.from) {
            onChange({ from: dia, to: undefined });
            setEsperandoFim(true);
            return;
        }

        // Fim antes do início é o início que foi escolhido por último.
        onChange(
            isBefore(dia, value.from)
                ? { from: dia, to: value.from }
                : { from: value.from, to: dia },
        );
        // O próximo clique recomeça o período.
        setEsperandoFim(false);
        // Período completo é o campo tocado: a validação já pode falar, sem
        // esperar a gaveta fechar.
        onBlur?.();
    };

    const resumo =
        value.from && value.to
            ? formatDateRange(value.from, value.to)
            : value.from
              ? `${format(value.from, "d 'de' MMMM", { locale: ptBR })} – escolha o último dia`
              : "Selecionar datas";

    const { from: refInicio, to: refFim } = referencia?.periodo ?? {};
    const faixa =
        refInicio && refFim ? { from: refInicio, to: refFim } : undefined;

    return (
        <GavetaCalendario
            id={id}
            aberto={aberto}
            onAbertoChange={alternar}
            gatilhoRef={gatilho}
            aria-labelledby={`${id}-rotulo ${id}`}
            invalido={invalido}
            icone={icone}
            vazio={!value.to}
            resumo={resumo}
            className="w-full"
        >
            <Calendar
                autoFocus
                mode="range"
                captionLayout="dropdown"
                defaultMonth={value.from ?? mesInicial}
                selected={value}
                onSelect={(_, dia) => escolherDia(dia)}
                modifiers={
                    faixa && {
                        referencia: faixa,
                        referencia_inicio: faixa.from,
                        referencia_fim: faixa.to,
                    }
                }
                // A faixa vai na célula, e a escolha no botão por cima dela:
                // o dia escolhido cobre a faixa sem precisar de exceção. O
                // `not-data-[selected]` é para a célula das pontas, que o
                // calendário já pinta com a cor do intervalo escolhido.
                modifiersClassNames={{
                    referencia:
                        "not-data-[selected=true]:bg-warning/25 rounded-none",
                    referencia_inicio: "rounded-l-md",
                    referencia_fim: "rounded-r-md",
                }}
                className="bg-transparent"
                // A caixa acompanha a coluna, mas a grade para nos 21.5rem dos
                // outros campos de data: os dias são quadrados, e numa coluna
                // larga cresceriam até virar botões enormes.
                classNames={{ root: "mx-auto w-full max-w-86" }}
            />
            {/* O passo da vez, dito: a escolha em dois cliques não se
                adivinha olhando a grade. */}
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-3 py-2 text-xs">
                <p aria-live="polite">
                    {esperandoFim
                        ? "Agora clique no último dia."
                        : "Clique no primeiro dia do período."}
                </p>
                {/* A legenda da faixa: só a cor não diz o que ela é. */}
                {faixa && referencia && (
                    <p className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="bg-warning/25 size-3 rounded-sm"
                        />
                        {referencia.rotulo}:{" "}
                        {formatDateRange(faixa.from, faixa.to)}
                    </p>
                )}
            </div>
        </GavetaCalendario>
    );
}
