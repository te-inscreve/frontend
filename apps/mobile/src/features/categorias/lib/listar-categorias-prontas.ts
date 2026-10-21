import { queryClient, trpc } from "~/utils/api";

/** A categoria `pronta_avaliacao` com o contexto que o cartão mostra. */
export interface CategoriaPronta {
    id: number;
    nome: string;
    eventoId: number;
    eventoNome: string;
    modalidadeId: number;
    modalidadeNome: string;
}

/**
 * As categorias liberadas para avaliação, de todos os eventos.
 *
 * Provisória: faz o fan-out eventos → modalidades → categorias e filtra a
 * situação aqui, sem filtrar por avaliador. É o único ponto a trocar quando a
 * API tiver o vínculo avaliador ↔ categoria e um endpoint próprio; quem chama
 * só conhece `CategoriaPronta`.
 */
export async function listarCategoriasProntas(): Promise<CategoriaPronta[]> {
    const eventos = await queryClient.fetchQuery(
        trpc.evento.getAll.queryOptions(),
    );

    const porEvento = await Promise.all(
        eventos.map(async (evento) => {
            const modalidades = await queryClient.fetchQuery(
                trpc.modalidade.getAll.queryOptions({ eventoId: evento.id }),
            );

            return Promise.all(
                modalidades.map(async (modalidade) => {
                    const categorias = await queryClient.fetchQuery(
                        trpc.categoria.getAll.queryOptions({
                            eventoId: evento.id,
                            modalidadeId: modalidade.id,
                        }),
                    );

                    return categorias
                        .filter(
                            (categoria) =>
                                categoria.situacao.value === "pronta_avaliacao",
                        )
                        .map((categoria) => ({
                            id: categoria.id,
                            nome: categoria.nome,
                            eventoId: evento.id,
                            eventoNome: evento.nome,
                            modalidadeId: modalidade.id,
                            modalidadeNome: modalidade.nome,
                        }));
                }),
            );
        }),
    );

    return porEvento.flat(2);
}
