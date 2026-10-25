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
}: {
    params: Promise<{
        slug: string;
        slugModalidade: string;
        slugCategoria: string;
    }>;
}) {
    const { slug, slugModalidade, slugCategoria } = use(params);
    const eventoId = parseInteger(slug);
    const modalidadeId = parseInteger(slugModalidade);
    const categoriaId = parseInteger(slugCategoria);

    if (!eventoId || !categoriaId || !modalidadeId) notFound();

    void prefetch(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    // As inscrições descem para a aba de inscritos, atrás do próprio boundary.
    void prefetch(
        trpc.inscricao.getAll.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    // E a ficha avaliativa, para a aba dela.
    void prefetch(
        trpc.categoria.getFichaAvaliativa.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    // E a classificação, para a aba de classificações.
    void prefetch(
        trpc.categoria.getResultados.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    // O evento também: é dele que a trilha tira o nome do evento e o da
    // modalidade.
    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            {/* <GoBackButton
                href={`/admin/eventos/${eventoId}/modalidades/${modalidadeId}`}
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
