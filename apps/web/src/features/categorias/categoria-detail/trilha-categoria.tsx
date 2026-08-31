import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { TrilhaEvento } from "~/shared/ui/trilha-evento";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

/**
 * A trilha do detalhe da categoria. Existe à parte do `DetalheCategoria` para
 * ter o próprio `<Suspense>`: a navegação aparece assim que evento e categoria
 * chegam, sem esperar o resto da tela.
 */
export async function TrilhaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: Props) {
    const categoria = await getQueryClient().fetchQuery(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    return (
        <TrilhaEvento
            eventoId={eventoId}
            modalidadeId={modalidadeId}
            atual={categoria?.nome}
        />
    );
}
