import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { Grupo, PaginaGrupos } from "@te-inscreve/schemas";

import type { useTRPC } from "~/shared/api/trpc/client";

type TRPC = ReturnType<typeof useTRPC>;

/**
 * Escreve um grupo atualizado direto na grade, sem esperar o próximo `fetch`.
 *
 * A grade (`grupo.list`) é uma query infinita que pode estar em cache mesmo
 * fora de tela — quem editou o grupo veio da própria página dele, uma rota
 * diferente da grade, e o "Voltar" é um `<Link>` que reaproveita o que já
 * está montado. Sem isto, voltar mostraria por um instante o cartão como
 * estava antes da edição, até o React Query rebuscar. Com isto, o cartão já
 * chega certo.
 *
 * `infiniteQueryFilter` casa só com a grade — a leitura equivalente do painel
 * da entidade (mesma rota, sem paginação infinita) é coisa rara de estar em
 * cache justo quando alguém edita um grupo, então essa fica para o
 * `invalidateQueries` de quem chama, que a alcança sem pressa.
 */
export function patchGrupoNaGrade(
    queryClient: QueryClient,
    trpc: TRPC,
    grupo: Grupo,
) {
    queryClient.setQueriesData<InfiniteData<PaginaGrupos>>(
        trpc.grupo.list.infiniteQueryFilter(),
        (data) => {
            if (!data) return data;
            return {
                ...data,
                pages: data.pages.map((pagina) => ({
                    ...pagina,
                    items: pagina.items.map((item) =>
                        item.id === grupo.id ? grupo : item,
                    ),
                })),
            };
        },
    );
}

/** O mesmo que {@link patchGrupoNaGrade}, para quando o grupo deixou de existir. */
export function removerGrupoDaGrade(
    queryClient: QueryClient,
    trpc: TRPC,
    id: number,
) {
    queryClient.setQueriesData<InfiniteData<PaginaGrupos>>(
        trpc.grupo.list.infiniteQueryFilter(),
        (data) => {
            if (!data) return data;
            // As páginas carregam o mesmo `totalItems` repetido; descontar
            // uma vez por página mantém a conta certa em todas elas.
            const totalItems = Math.max(
                0,
                (data.pages[0]?.totalItems ?? 0) - 1,
            );
            return {
                ...data,
                pages: data.pages.map((pagina) => ({
                    ...pagina,
                    items: pagina.items.filter((item) => item.id !== id),
                    totalItems,
                })),
            };
        },
    );
}
