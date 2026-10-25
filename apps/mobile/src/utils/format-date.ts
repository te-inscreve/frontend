/*
 * Os meses abreviados do `ptBR` do date-fns, já com a inicial maiúscula. O
 * `Intl` do Hermes devolve "mar." com ponto, então a tabela fica aqui.
 */
const MESES = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
] as const;

/**
 * Dia e mês abreviado no fuso do aparelho, como "5 de Mar". A mesma regra do
 * `formatDate` do web (`apps/web/src/shared/utils/format-date.ts`), sem o
 * date-fns, que o app mobile não tem.
 */
export function formatDate(date: Date) {
    return `${date.getDate()} de ${MESES[date.getMonth()]}`;
}

/** Hora e minuto no fuso do aparelho, como "14:32". */
export function formatHora(date: Date) {
    const doisDigitos = (n: number) => String(n).padStart(2, "0");
    return `${doisDigitos(date.getHours())}:${doisDigitos(date.getMinutes())}`;
}

/**
 * Quanto falta até `date`, arredondado para cima, como "em 2 min" ou "em
 * 30 s". O que já passou é "agora".
 */
export function formatFalta(date: Date, agora: number) {
    const segundos = Math.ceil((date.getTime() - agora) / 1000);
    if (segundos <= 0) return "agora";
    if (segundos < 60) return `em ${segundos} s`;
    return `em ${Math.ceil(segundos / 60)} min`;
}
