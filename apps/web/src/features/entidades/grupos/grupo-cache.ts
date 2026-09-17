import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { GrupoDetalhe, PaginaGrupos } from "@te-inscreve/schemas";

import type { useTRPC } from "~/shared/api/trpc/client";

type TRPC = ReturnType<typeof useTRPC>;

/** Quantos avatares o cartão mostra — o mesmo de `AvataresGrupo`. */
const MAX_AVATARES_NO_CARTAO = 3;

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
 * O detalhe traz a formação inteira, não o recorte de três que o cartão usa
 * (`firstThreeIntegrantes`) — por isso o recorte é refeito aqui, dos mesmos
 * `integrantes` que o detalhe acabou de salvar, em vez de simplesmente
 * substituir o item da grade e perder os avatares até a próxima rebusca.
 *
 * `infiniteQueryFilter` casa só com a grade — a leitura equivalente do painel
 * da entidade (mesma rota, sem paginação infinita) é coisa rara de estar em
 * cache justo quando alguém edita um grupo, então essa fica para o
 * `invalidateQueries` de quem chama, que a alcança sem pressa.
 */
export function patchGrupoNaGrade(
    queryClient: QueryClient,
    trpc: TRPC,
    grupo: GrupoDetalhe,
) {
    const { integrantes, ...resumo } = grupo;
    const item = {
        ...resumo,
        firstThreeIntegrantes: integrantes
            .slice(0, MAX_AVATARES_NO_CARTAO)
            .map(({ id, nome, sobrenome }) => ({ id, nome, sobrenome })),
    };

    queryClient.setQueriesData<InfiniteData<PaginaGrupos>>(
        trpc.grupo.list.infiniteQueryFilter(),
        (data) => {
            if (!data) return data;
            return {
                ...data,
                pages: data.pages.map((pagina) => ({
                    ...pagina,
                    items: pagina.items.map((existente) =>
                        existente.id === item.id ? item : existente,
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
