import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { AcoesEvento } from "~/features/eventos/evento-detail/acoes-evento";
import { DetalheEvento } from "~/features/eventos/evento-detail/detalhe-evento";
import { DetalheEventoSkeleton } from "~/features/eventos/evento-detail/detalhe-evento-skeleton";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";
import { parseInteger } from "~/shared/utils/parsers";

export default function EventoDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ slug }, query] = use(Promise.all([params, searchParams]));
    const idEvento = parseInteger(slug);
    const idModalidade = parseInteger(query.modalidade);

    if (!idEvento) notFound();
    void prefetch(trpc.evento.getById.queryOptions({ id: idEvento }));

    if (idModalidade) {
        void prefetch(
            trpc.modalidade.getById.queryOptions({
                eventoId: idEvento,
                modalidadeId: idModalidade,
            }),
        );
    }

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <div className="flex items-start justify-between gap-3">
                <GoBackButton href="/admin/eventos" />
                <AcoesEvento eventoId={idEvento} />
            </div>

            <Suspense fallback={<DetalheEventoSkeleton />}>
                <DetalheEvento id={idEvento} modalidadeAtiva={idModalidade} />
            </Suspense>
        </div>
    );
}
