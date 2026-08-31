import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { FormModalidade } from "~/features/modalidades/form-modalidade/form-modalidade";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEvento, TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Criar modalidade | Te Inscreve",
    description: "Cadastro de uma nova modalidade do evento",
};

export default function CriarModalidadePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const eventoId = parseInteger(slug);

    if (!eventoId) notFound();

    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));

    return (
        <FormModalidade
            eventoId={eventoId}
            trilha={
                <Suspense fallback={<TrilhaEventoSkeleton />}>
                    {/* Sem modalidade ainda: a trilha para no evento. */}
                    <TrilhaEvento
                        eventoId={eventoId}
                        atual="Criar modalidade"
                    />
                </Suspense>
            }
        />
    );
}
