import { ListaInscricoes } from "~/features/inscricoes/lista-inscricoes";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

/**
 * A aba de inscritos da categoria.
 *
 * Server Component atrás do seu próprio `<Suspense>`: o `fetchQuery`
 * reaproveita o `prefetch` disparado pela página, e o resto do detalhe não
 * espera por esta lista.
 */
export async function InscricoesDaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: Props) {
    const inscricoes = await getQueryClient().fetchQuery(
        trpc.inscricao.getAll.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    return <ListaInscricoes inscricoes={inscricoes} />;
}
