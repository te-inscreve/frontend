import Link from "next/link";
import { CalendarDots } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin";

import { Skeleton } from "@te-inscreve/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { FallbackImage } from "~/shared/ui/fallback-image";
import { formatDateRange } from "~/shared/utils/format-date";

export const QUANTIDADE_ULTIMOS_EVENTOS = 3;

/**
 * Os eventos cadastrados mais recentemente, com link para a página pública.
 *
 * Some inteira quando não há evento ou a API falha: é vitrine, e uma vitrine
 * com erro é pior do que nenhuma.
 */
export async function UltimosEventos() {
    let eventos;
    try {
        eventos = await getQueryClient().fetchQuery(
            trpc.evento.getAll.queryOptions(),
        );
    } catch {
        return null;
    }

    const ultimos = [...eventos]
        .sort((a, b) => b.id - a.id)
        .slice(0, QUANTIDADE_ULTIMOS_EVENTOS);

    if (ultimos.length === 0) return null;

    return (
        <ListaUltimosEventos>
            {ultimos.map((evento) => (
                <li key={evento.id}>
                    <Link
                        href={`/eventos/${evento.id}`}
                        className="group bg-card hover:border-primary/50 focus-visible:ring-ring flex items-center gap-4 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                        <FallbackImage
                            src={evento.cartaz}
                            alt=""
                            fallbackMessage=""
                            width={128}
                            height={128}
                            className="size-16 shrink-0 rounded-md border object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="truncate font-semibold">
                                {evento.nome}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                <CalendarDots aria-hidden />
                                {formatDateRange(
                                    new Date(evento.dataInicio),
                                    new Date(evento.dataFim),
                                )}
                            </p>
                            <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
                                <MapPin aria-hidden className="shrink-0" />
                                <span className="truncate">{evento.local}</span>
                            </p>
                        </div>
                    </Link>
                </li>
            ))}
        </ListaUltimosEventos>
    );
}

/** Mesma geometria da lista, para a página não pular quando ela chega. */
export function UltimosEventosSkeleton() {
    return (
        <ListaUltimosEventos carregando>
            {Array.from({ length: QUANTIDADE_ULTIMOS_EVENTOS }, (_, i) => (
                <li key={i}>
                    <div className="flex items-center gap-4 rounded-lg border p-3">
                        <Skeleton className="size-16 shrink-0 rounded-md" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                </li>
            ))}
        </ListaUltimosEventos>
    );
}

function ListaUltimosEventos({
    carregando = false,
    children,
}: {
    carregando?: boolean;
    children: React.ReactNode;
}) {
    return (
        <section
            aria-labelledby="ultimos-eventos"
            aria-busy={carregando}
            className="flex flex-col gap-6"
        >
            <h2
                id="ultimos-eventos"
                className="text-2xl font-semibold tracking-tight"
            >
                Últimos eventos
            </h2>
            <ul className="grid gap-3 md:grid-cols-3">{children}</ul>
        </section>
    );
}
