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
