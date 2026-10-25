import type { Metadata } from "next";
import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { EventoPublico } from "~/features/eventos/evento-publico/evento-publico";
import { EventoPublicoSkeleton } from "~/features/eventos/evento-publico/evento-publico-skeleton";
import { metadataDoEventoPorSegmento } from "~/features/eventos/shared/metadata-evento";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";
import { parseInteger } from "~/shared/utils/parsers";

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * A prévia do link compartilhado. É a exceção a "nada de `await`": as meta
 * tags precisam do evento, e o Next só as segura para robôs — para o
 * navegador elas entram no stream depois, sem atrasar o primeiro render.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return metadataDoEventoPorSegmento((await params).id);
}

/**
 * A página pública do evento, fora do portão de login: é o link que o
 * organizador compartilha. A gestão continua em `/admin/eventos/[slug]`.
 */
export default function EventoPublicoPage({ params }: Props) {
    const { id } = use(params);
    const idEvento = parseInteger(id);

    if (!idEvento) notFound();
    void prefetch(trpc.evento.getById.queryOptions({ id: idEvento }));

    return (
        <div className="container mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:py-10">
            {/* Para a vitrine, e não `router.back()`: quem chega por link
                compartilhado não tem página anterior no site. */}
            <GoBackButton href="/" className="-ml-3 w-fit cursor-pointer" />

            <Suspense fallback={<EventoPublicoSkeleton />}>
                <EventoPublico id={idEvento} />
            </Suspense>
        </div>
    );
}
