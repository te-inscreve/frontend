import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FormCategoria } from "~/features/categorias/form-categoria/form-categoria";
import { getQueryClient, prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEvento, TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Editar categoria | Te Inscreve",
    description: "Edição dos dados básicos de uma categoria",
};

export default async function EditarCategoriaPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string; slugCategoria: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ slug, slugCategoria }, query] = await Promise.all([
        params,
        searchParams,
    ]);
    const eventoId = parseInteger(slug);
    const categoriaId = parseInteger(slugCategoria);
    // Como no detalhe, a modalidade vem na query: o endpoint é aninhado nela,
    // mas ela não faz parte da rota.
    const modalidadeId = parseInteger(query.modalidade);

    if (!eventoId || !categoriaId || !modalidadeId) notFound();

    // O evento entra em voo junto da categoria: é dele que a trilha tira os
    // nomes do evento e da modalidade.
    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));

    // O formulário precisa dos valores atuais para montar os `defaultValues`,
    // então aqui se espera a categoria em vez de servir um shell com `Suspense`.
    const categoria = await getQueryClient().fetchQuery(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    if (!categoria) notFound();

    return (
        <FormCategoria
            eventoId={eventoId}
            modalidadeId={modalidadeId}
            categoria={categoria}
            trilha={
                <Suspense fallback={<TrilhaEventoSkeleton />}>
                    <TrilhaEvento
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        atual={`Editar ${categoria.nome}`}
                    />
                </Suspense>
            }
        />
    );
}
