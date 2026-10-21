import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { AcoesEvento } from "~/features/eventos/evento-detail/acoes-evento";
import { DetalheEvento } from "~/features/eventos/evento-detail/detalhe-evento";
import { DetalheEventoSkeleton } from "~/features/eventos/evento-detail/detalhe-evento-skeleton";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";
import { parseInteger } from "~/shared/utils/parsers";

/**
 * O evento sem modalidade na rota: abre na primeira aba. Com modalidade, a
 * mesma tela vive em `modalidades/[slugModalidade]/page.tsx`.
 */
export default function EventoDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const idEvento = parseInteger(slug);

    if (!idEvento) notFound();
    void prefetch(trpc.evento.getById.queryOptions({ id: idEvento }));

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <div className="flex items-start justify-between gap-3">
                <GoBackButton href="/admin/eventos" />
                <AcoesEvento eventoId={idEvento} />
            </div>

            <Suspense fallback={<DetalheEventoSkeleton />}>
                <DetalheEvento id={idEvento} />
            </Suspense>
        </div>
    );
}
