import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function timeAgo(date: Date): string {
    const result = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    return result.replace("cerca de ", "");
}

/**
 * Formata um intervalo omitindo o que as duas pontas têm em comum. Função pura
 * para poder ser chamada também de um Server Component, onde hooks não existem.
 */
function formatDateRange(start: Date, end: Date): string {
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
}

/** Mantido para os componentes de cliente que já consomem o formatador. */
function useDateRangeFormatter() {
    return { formatDateRange };
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const formatSameDay = (date: Date) => {
    return capitalize(format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }));
};

const formatSameMonth = (start: Date, end: Date) => {
    const dayStart = format(start, "d");
    const dayEnd = format(end, "d");
    // Sem `capitalize`: aqui o trecho começa na preposição, e maiúscula nela
    // sairia "10 – 15 De agosto de 2026".
    const rest = format(end, "'de' MMMM 'de' yyyy", { locale: ptBR });

    return `${dayStart} – ${dayEnd} ${rest}`;
};

const formatSameYear = (start: Date, end: Date) => {
    const startStr = format(start, "d 'de' MMMM", { locale: ptBR });
    const endStr = format(end, "d 'de' MMMM", { locale: ptBR });

    return `${capitalize(startStr)} – ${capitalize(
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

    return `${capitalize(startStr)} – ${capitalize(endStr)}`;
};

const formatDate = (date: Date) => {
    return `${format(date, "d", { locale: ptBR })} de ${capitalize(format(date, "MMM", { locale: ptBR }))}`;
};

const formatDateTime = (date: Date) => {
    const hora = format(date, "HH", { locale: ptBR }) + "h";
    const minuto = format(date, "m", { locale: ptBR });
    const fullHour =
        minuto === "0" ? hora : `${hora}${minuto.padStart(2, "0")}`;
    return `${format(date, "d", { locale: ptBR })} de ${capitalize(format(date, "MMMM", { locale: ptBR }))} às ${fullHour}`;
};

export {
    formatDate,
    formatDateRange,
    formatDateTime,
    timeAgo,
    useDateRangeFormatter,
};
