import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { DetalheCategoria } from "~/features/categorias/categoria-detail/detalhe-categoria";
import { DetalheCategoriaSkeleton } from "~/features/categorias/categoria-detail/detalhe-categoria-skeleton";
import { TrilhaCategoria } from "~/features/categorias/categoria-detail/trilha-categoria";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Categoria | Te Inscreve",
    description: "Detalhe de uma categoria da modalidade",
};

export default function CategoriaDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string; slugCategoria: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ slug, slugCategoria }, query] = use(
        Promise.all([params, searchParams]),
    );
    const eventoId = parseInteger(slug);
    const categoriaId = parseInteger(slugCategoria);
    // O recurso é aninhado na modalidade, mas ela não está na rota — vem na
    // query, posta pelo cartão que trouxe até aqui.
    const modalidadeId = parseInteger(query.modalidade);

    if (!eventoId || !categoriaId || !modalidadeId) notFound();

    void prefetch(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    // O evento também: é dele que a trilha tira o nome do evento e o da
    // modalidade da query.
    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            {/* <GoBackButton
                href={`/admin/eventos/${eventoId}?modalidade=${modalidadeId}`}
            /> */}

            <Suspense fallback={<TrilhaEventoSkeleton />}>
                <TrilhaCategoria
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                />
            </Suspense>

            <Suspense fallback={<DetalheCategoriaSkeleton />}>
                <DetalheCategoria
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                />
            </Suspense>
        </div>
    );
}
