import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DetalheEvento } from "~/features/eventos/evento-detail/detalhe-evento";
import { DetalheEventoSkeleton } from "~/features/eventos/evento-detail/detalhe-evento-skeleton";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";

export default async function EventoDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const id = Number(slug);

    // A lista linka por `id`, então uma URL com qualquer outra coisa não
    // corresponde a evento nenhum — e `getById` só aceita inteiro positivo.
    if (!Number.isInteger(id) || id <= 0) notFound();

    // Dispara a busca antes da fronteira de Suspense: o shell abaixo já sai no
    // stream enquanto o request corre, e `DetalheEvento` só aguarda a promise.
    void prefetch(trpc.evento.getById.queryOptions({ id }));

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <GoBackButton href="/admin/eventos" />

            <Suspense fallback={<DetalheEventoSkeleton />}>
                <DetalheEvento id={id} />
            </Suspense>
        </div>
    );
}
