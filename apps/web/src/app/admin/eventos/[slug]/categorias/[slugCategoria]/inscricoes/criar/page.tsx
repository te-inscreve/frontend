import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { TrilhaInscricao } from "~/features/inscricoes/trilha-inscricao";
import { TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export default function NovaInscricaoPage({
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
    const modalidadeId = parseInteger(query.modalidade);

    if (!eventoId || !categoriaId || !modalidadeId) notFound();

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <Suspense fallback={<TrilhaEventoSkeleton />}>
                <TrilhaInscricao
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                />
            </Suspense>
        </div>
    );
}
