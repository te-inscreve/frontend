import type { TrilhaPasso } from "~/shared/ui/trilha-builder";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { TrilhaBuilder } from "~/shared/ui/trilha-builder";
import { SeletorCategoria } from "./seletor-categoria";

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

    // A modalidade é o último degrau quando a categoria não vem (id de link
    // velho, ou ainda carregando).
    const modalidadeEhAtual = modalidade !== undefined && categoria === null;

    const passos: TrilhaPasso[] = [
        { label: evento.nome, href: `/admin/eventos/${eventoId}` },
    ];

    if (modalidade !== undefined) {
        passos.push({
            label: modalidade.nome,
            href: modalidadeEhAtual
                ? undefined
                : `/admin/eventos/${eventoId}?modalidade=${modalidadeId}`,
        });
    }

    if (categoria !== null) {
        passos.push({
            label: categoria.nome,
            conteudo: (
                <SeletorCategoria
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                    nome={categoria.nome}
                />
            ),
        });
    }

    return <TrilhaBuilder passos={passos} />;
}
