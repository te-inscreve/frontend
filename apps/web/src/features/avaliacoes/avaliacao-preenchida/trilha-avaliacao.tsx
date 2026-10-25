import type { CaminhoDaInscricao } from "./lib/avaliacoes-da-inscricao";
import type { TrilhaPasso } from "~/shared/ui/trilha-builder";
import { nomeDoClassificado } from "~/features/categorias/categoria-detail/lib/classificado";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { TrilhaBuilder } from "~/shared/ui/trilha-builder";
import { daCategoria } from "./lib/avaliacoes-da-inscricao";

/**
 * A trilha das fichas da inscrição: evento, modalidade e categoria levam de
 * volta; quem foi avaliado fecha a trilha. Tem o próprio `<Suspense>`, como a
 * do detalhe da categoria, e as mesmas leituras já disparadas pela página.
 */
export async function TrilhaAvaliacao({
    caminho,
}: {
    caminho: CaminhoDaInscricao;
}) {
    const { eventoId, modalidadeId, categoriaId, inscricaoId } = caminho;
    const [evento, categoria, resultados] = await Promise.all([
        getQueryClient().fetchQuery(
            trpc.evento.getById.queryOptions({ id: eventoId }),
        ),
        getQueryClient().fetchQuery(
            trpc.categoria.getById.queryOptions(daCategoria(caminho)),
        ),
        getQueryClient().fetchQuery(
            trpc.categoria.getResultados.queryOptions(daCategoria(caminho)),
        ),
    ]);

    if (!evento) return null;

    const modalidade = evento.modalidades.find(({ id }) => id === modalidadeId);
    const resultado = resultados.find(({ id }) => id === inscricaoId);

    const passos: TrilhaPasso[] = [
        { label: evento.nome, href: `/admin/eventos/${eventoId}` },
    ];
    if (modalidade) {
        passos.push({
            label: modalidade.nome,
            href: `/admin/eventos/${eventoId}/modalidades/${modalidadeId}`,
        });
    }
    if (categoria) {
        passos.push({
            label: categoria.nome,
            href: `/admin/eventos/${eventoId}/modalidades/${modalidadeId}/categorias/${categoriaId}`,
        });
    }
    passos.push({
        label: resultado
            ? nomeDoClassificado(resultado)
            : `Inscrição ${inscricaoId}`,
    });

    return <TrilhaBuilder passos={passos} />;
}
