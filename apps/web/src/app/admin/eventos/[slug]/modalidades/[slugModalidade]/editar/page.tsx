import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FormEdicaoModalidade } from "~/features/modalidades/form-modalidade/form-edicao-modalidade";
import { getQueryClient, prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEvento, TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Editar modalidade | Te Inscreve",
    description: "Edição das regras de uma modalidade do evento",
};

export default async function EditarModalidadePage({
    params,
}: {
    params: Promise<{ slug: string; slugModalidade: string }>;
}) {
    const { slug, slugModalidade } = await params;
    const eventoId = parseInteger(slug);
    const modalidadeId = parseInteger(slugModalidade);

    if (!eventoId || !modalidadeId) notFound();

    // O evento entra em voo junto da modalidade: é dele que a trilha tira os
    // nomes do evento e da modalidade.
    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));

    // O formulário precisa dos valores atuais para montar os `defaultValues`,
    // então aqui se espera a modalidade em vez de servir um shell com
    // `Suspense`.
    const modalidade = await getQueryClient().fetchQuery(
        trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }),
    );

    // Nulo é 404 do backend: modalidade que não existe, ou que não pertence
    // àquele evento.
    if (!modalidade) notFound();

    return (
        <FormEdicaoModalidade
            eventoId={eventoId}
            modalidade={modalidade}
            trilha={
                <Suspense fallback={<TrilhaEventoSkeleton />}>
                    <TrilhaEvento
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        atual="Editar modalidade"
                    />
                </Suspense>
            }
        />
    );
}
