import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { AcoesEvento } from "~/features/eventos/evento-detail/acoes-evento";
import { DetalheEvento } from "~/features/eventos/evento-detail/detalhe-evento";
import { DetalheEventoSkeleton } from "~/features/eventos/evento-detail/detalhe-evento-skeleton";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";
import { parseInteger } from "~/shared/utils/parsers";

/**
 * O evento com a aba de uma modalidade aberta. É a mesma tela de
 * `[slug]/page.tsx`; a modalidade na rota é o que as páginas aninhadas nela
 * (categorias, inscrições) têm como degrau de volta.
 */
export default function ModalidadeDetailPage({
    params,
}: {
    params: Promise<{ slug: string; slugModalidade: string }>;
}) {
    const { slug, slugModalidade } = use(params);
    const idEvento = parseInteger(slug);
    const idModalidade = parseInteger(slugModalidade);

    if (!idEvento || !idModalidade) notFound();

    void prefetch(trpc.evento.getById.queryOptions({ id: idEvento }));
    void prefetch(
        trpc.modalidade.getById.queryOptions({
            eventoId: idEvento,
            modalidadeId: idModalidade,
        }),
    );

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
