import type { TrilhaPasso } from "~/shared/ui/trilha-builder";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { TrilhaBuilder } from "~/shared/ui/trilha-builder";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

/**
 * Trilha "evento › modalidade › categoria › Inscrição" da tela de nova
 * inscrição. Evento e categoria são buscados em paralelo; a modalidade sai
 * das modalidades do próprio evento, como no `TrilhaEvento`.
 */
export async function TrilhaInscricao({
    eventoId,
    modalidadeId,
    categoriaId,
}: Props) {
    const [evento, categoria] = await Promise.all([
        getQueryClient().fetchQuery(
            trpc.evento.getById.queryOptions({ id: eventoId }),
        ),
        getQueryClient().fetchQuery(
            trpc.categoria.getById.queryOptions({
                eventoId,
                modalidadeId,
                categoriaId,
            }),
        ),
    ]);

    if (!evento) return null;

    const modalidade = evento.modalidades.find(({ id }) => id === modalidadeId);

    const passos: TrilhaPasso[] = [
        { label: evento.nome, href: `/admin/eventos/${eventoId}` },
    ];

    if (modalidade !== undefined) {
        passos.push({
            label: modalidade.nome,
            href: `/admin/eventos/${eventoId}/modalidades/${modalidadeId}`,
        });
    }

    if (categoria !== null) {
        passos.push({
            label: categoria.nome,
            href: `/admin/eventos/${eventoId}/modalidades/${modalidadeId}/categorias/${categoriaId}`,
        });
    }

    passos.push({ label: "Criar Inscrição" });

    return <TrilhaBuilder passos={passos} />;
}
