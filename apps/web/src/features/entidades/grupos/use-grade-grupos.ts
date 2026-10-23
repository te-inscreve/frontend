"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import type { FormGrupo } from "@te-inscreve/schemas";
import { proximaPagina } from "@te-inscreve/schemas";

import { useTRPC } from "~/shared/api/trpc/client";
import { relancarPorCampo } from "./grupo";

/**
 * Quanto esperar, depois de fechar o diálogo, antes de trocar de rota.
 *
 * `BotaoCriarGrupo` fecha o `ExpandableDialog` assim que `criarGrupo`
 * resolve, e o fechamento é um morph — o cartão encolhe de volta para o
 * botão (`EXPANSION_TRANSITION`, em `@te-inscreve/components`). Navegar na
 * hora trocaria a página no meio do encolhimento, e quem clicou nunca veria
 * o gesto terminar. A espera é só para isso: dar tempo do morph rodar antes
 * de a grade sair de cena.
 */
const ESPERA_ANIMACAO_MS = 350;

/**
 * A grade de grupos da entidade: listar, paginar e criar.
 *
 * A formação de um grupo não mora mais aqui — abrir um grupo é navegar para
 * `grupos/[id]`, que tem o próprio hook (`use-detalhe-grupo.ts`). Esta grade
 * só lista, então a query é uma só: `grupo.list`, infinita, com a primeira
 * página hidratada do servidor.
 */
export function useGradeGrupos({ pageSize }: { pageSize: number }) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();

    const lista = useInfiniteQuery(
        trpc.grupo.list.infiniteQueryOptions(
            { pageSize },
            { getNextPageParam: proximaPagina },
        ),
    );

    const grupos = useMemo(
        () => lista.data?.pages.flatMap((pagina) => pagina.items) ?? [],
        [lista.data],
    );
    const total = lista.data?.pages[0]?.totalItems ?? 0;

    const { hasNextPage, isFetchingNextPage, fetchNextPage } = lista;
    const carregarMais = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const criar = useMutation(trpc.grupo.create.mutationOptions());

    /**
     * Cria o grupo e já leva para a página dele: quem acabou de nomear um
     * grupo vazio tem uma coisa a fazer em seguida, que é colocar gente nele.
     *
     * A grade está montada quando isto roda — é o botão dela que chama —,
     * então `invalidateQueries` já basta: a query é ativa, e o React Query a
     * rebusca sozinho, bem a tempo de o "Voltar" da página do grupo novo
     * encontrar o cartão certo.
     *
     * A navegação em si fica para depois de `criarGrupo` resolver: é a
     * resolução que fecha o diálogo (`BotaoCriarGrupo` espera por ela), e o
     * `setTimeout` — sem `await` — deixa isso acontecer primeiro. Ver
     * {@link ESPERA_ANIMACAO_MS}.
     */
    const criarGrupo = useCallback(
        async (dados: FormGrupo) => {
            const novo = await criar.mutateAsync(dados).catch(relancarPorCampo);
            await Promise.all([
                queryClient.invalidateQueries(trpc.grupo.list.pathFilter()),
                queryClient.invalidateQueries(
                    trpc.entidade.minha.queryFilter(),
                ),
            ]);
            setTimeout(() => {
                router.push(`/admin/minha-entidade/grupos/${novo.id}`);
            }, ESPERA_ANIMACAO_MS);
        },
        [criar, queryClient, trpc, router],
    );

    return {
        grupos,
        total,
        carregando: lista.isLoading,
        erro: lista.error,
        isFetchingNextPage,
        carregarMais,
        criarGrupo,
    };
}
