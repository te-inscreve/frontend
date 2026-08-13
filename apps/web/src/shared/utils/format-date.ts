import { useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function timeAgo(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function useDateRangeFormatter() {
    const formatDateRange = useCallback((start: Date, end: Date) => {
        const sameDay = start.getTime() === end.getTime();

        const sameMonth =
            start.getMonth() === end.getMonth() &&
            start.getFullYear() === end.getFullYear();

        const sameYear = start.getFullYear() === end.getFullYear();

        // 🟢 Mesmo dia
        if (sameDay) {
            return formatSameDay(start);
        }

        // 🟡 Mesmo mês
        if (sameMonth) {
            return formatSameMonth(start, end);
        }

        // 🔵 Mesmo ano
        if (sameYear) {
            return formatSameYear(start, end);
        }

        // 🔴 Anos diferentes
        return formatDifferentYears(start, end);
    }, []);

    return { formatDateRange };
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const formatSameDay = (date: Date) => {
    return capitalize(format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }));
};

const formatSameMonth = (start: Date, end: Date) => {
    const dayStart = format(start, "d");
    const dayEnd = format(end, "d");
    const rest = format(end, "'de' MMMM 'de' yyyy", { locale: ptBR });

    return `${dayStart} à ${dayEnd} ${capitalize(rest)}`;
};

const formatSameYear = (start: Date, end: Date) => {
    const startStr = format(start, "d 'de' MMMM", { locale: ptBR });
    const endStr = format(end, "d 'de' MMMM", { locale: ptBR });

    return `${capitalize(startStr)} à ${capitalize(
        endStr,
    )} de ${format(end, "yyyy")}`;
};

const formatDifferentYears = (start: Date, end: Date) => {
    const startStr = format(start, "d 'de' MMMM 'de' yyyy", {
        locale: ptBR,
    });
    const endStr = format(end, "d 'de' MMMM 'de' yyyy", {
        locale: ptBR,
    });

    return `${capitalize(startStr)} à ${capitalize(endStr)}`;
};
