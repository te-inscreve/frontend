import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { FormCategoria } from "~/features/categorias/form-categoria/form-categoria";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEvento, TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Criar categoria | Te Inscreve",
    description: "Cadastro de uma nova categoria da modalidade",
};

export default function CriarCategoriaPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string; modalidadeId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ slug }, query] = use(Promise.all([params, searchParams]));
    const idEvento = parseInteger(slug);
    const idModalidade = parseInteger(query.modalidadeId);

    if (!idEvento || !idModalidade) notFound();

    // A trilha precisa do evento para os nomes; o prefetch põe a busca em voo
    // antes de o formulário ser montado.
    void prefetch(trpc.evento.getById.queryOptions({ id: idEvento }));

    return (
        <FormCategoria
            eventoId={idEvento}
            modalidadeId={idModalidade}
            trilha={
                <Suspense fallback={<TrilhaEventoSkeleton />}>
                    <TrilhaEvento
                        eventoId={idEvento}
                        modalidadeId={idModalidade}
                        atual="Criar categoria"
                    />
                </Suspense>
            }
        />
    );
}
