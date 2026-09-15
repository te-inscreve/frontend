"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import type { FormGrupo, GrupoDetalhe } from "@te-inscreve/schemas";
import { proximaPagina } from "@te-inscreve/schemas";

import type { FiltrosIntegrantes } from "~/features/entidades/integrantes/filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    filtrarIntegrantes,
    filtrosVazios,
} from "~/features/entidades/integrantes/filtros-integrantes";
import { useTRPC } from "~/shared/api/trpc/client";
import { relancarPorCampo, resumirFormacao } from "./grupo";
import { patchGrupoNaGrade, removerGrupoDaGrade } from "./grupo-cache";

interface Opcoes {
    id: number;
    /** Quantos integrantes por página na cesta. O mesmo do `prefetch` da página. */
    integrantesPorPagina: number;
}

/**
 * O estado da página de um grupo: a formação, a cesta de integrantes de onde
 * ela se monta, e as ações do menu (editar, excluir).
 *
 * Duas leituras do cliente. O grupo é `grupo.getById`, a única que traz a
 * formação; a cesta é `integrante.list`, query infinita com a primeira
 * página hidratada do servidor.
 *
 * A formação em cena é um **rascunho** por cima do detalhe: clicar nos cartões
 * mexe em `formacao`, e só "Salvar formação" manda o `PATCH`. Enquanto o
 * rascunho é `null`, o que a tela mostra é exatamente o que a API guardou —
 * é assim que abrir a página, e salvar, deixam nada pendente sem precisar
 * copiar a lista do servidor para o estado.
 *
 * Editar, salvar a formação e excluir escrevem direto no cache em vez de só
 * invalidar (ver `grupo-cache.ts`): esta página não é mais a grade, então
 * invalidar sozinho deixaria o cartão da grade desatualizado até o próximo
 * `fetch` — e é exatamente o cartão que o botão "Voltar" leva a ver a
 * seguir. Escrever na hora é o que mantém a volta instantânea sem mostrar
 * informação velha por um instante.
 */
export function useDetalheGrupo({ id, integrantesPorPagina }: Opcoes) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [filtros, setFiltros] = useState<FiltrosIntegrantes>(filtrosVazios);
    /** O rascunho da formação; `null` enquanto ninguém mexeu. */
    const [formacao, setFormacao] = useState<Integrante[] | null>(null);

    // ---- O grupo ------------------------------------------------------

    const detalhe = useQuery(trpc.grupo.getById.queryOptions({ id }));
    const salvo = detalhe.data ?? null;

    const grupoAberto = useMemo<GrupoDetalhe | null>(() => {
        if (!salvo) return null;
        const integrantes = formacao ?? salvo.integrantes;
        return { ...salvo, integrantes, ...resumirFormacao(integrantes) };
    }, [salvo, formacao]);

    /**
     * Se o rascunho difere do que a API guardou.
     *
     * Compara por conjunto, e não por posição: a ordem em que a gente entrou no
     * grupo não é dado nenhum, e ordená-la só para comparar faria o botão
     * acender por uma diferença que a tela não mostra.
     */
    const formacaoMudou = useMemo(() => {
        if (!salvo || !formacao) return false;
        if (formacao.length !== salvo.integrantes.length) return true;

        const salvos = new Set(salvo.integrantes.map(({ id }) => id));
        return formacao.some(({ id }) => !salvos.has(id));
    }, [salvo, formacao]);

    // ---- As mutações ------------------------------------------------------

    const editar = useMutation(trpc.grupo.update.mutationOptions());
    const salvar = useMutation(trpc.grupo.salvarFormacao.mutationOptions());
    const remover = useMutation(trpc.grupo.remove.mutationOptions());

    /** Edita nome e descrição e escreve o resultado no detalhe e na grade. */
    const editarGrupo = useCallback(
        async (dados: FormGrupo) => {
            const atualizado = await editar
                .mutateAsync({ id, grupo: dados })
                .catch(relancarPorCampo);

            queryClient.setQueryData(
                trpc.grupo.getById.queryKey({ id }),
                atualizado,
            );
            patchGrupoNaGrade(queryClient, trpc, atualizado);
            void queryClient.invalidateQueries(trpc.grupo.list.pathFilter());
        },
        [editar, id, queryClient, trpc],
    );

    /** Exclui e volta para a grade — o detalhe aberto deixou de existir. */
    const excluirGrupo = useCallback(async () => {
        await remover.mutateAsync({ id });

        // Sem isto o detalhe ficaria no cache e, reaberto pelo id, pediria
        // um 404 antes de dizer que não existe.
        queryClient.removeQueries(trpc.grupo.getById.queryFilter({ id }));
        removerGrupoDaGrade(queryClient, trpc, id);
        void queryClient.invalidateQueries(trpc.grupo.list.pathFilter());
        void queryClient.invalidateQueries(trpc.entidade.minha.queryFilter());

        router.push("/admin/minha-entidade/grupos");
    }, [remover, id, queryClient, trpc, router]);

    /**
     * Salva o rascunho da bancada.
     *
     * O `setQueryData` já deixa `salvo` com a formação nova antes de o
     * rascunho ser solto — ao contrário de esperar uma rebusca, aqui não há
     * instante em que a tela mostraria a formação antiga: as duas escritas
     * caem no mesmo lote de render do React.
     */
    const salvarFormacao = useCallback(async () => {
        if (!formacao) return;

        const atualizado = await salvar.mutateAsync({
            id,
            integrantes: formacao.map(({ id }) => id),
        });

        queryClient.setQueryData(
            trpc.grupo.getById.queryKey({ id }),
            atualizado,
        );
        patchGrupoNaGrade(queryClient, trpc, atualizado);
        void queryClient.invalidateQueries(trpc.grupo.list.pathFilter());
        setFormacao(null);
    }, [formacao, salvar, id, queryClient, trpc]);

    // ---- A cesta ----------------------------------------------------------

    const lista = useInfiniteQuery(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: integrantesPorPagina },
            { getNextPageParam: proximaPagina },
        ),
    );

    const integrantes = useMemo(
        () => lista.data?.pages.flatMap((pagina) => pagina.items) ?? [],
        [lista.data],
    );
    const total = lista.data?.pages[0]?.totalItems ?? 0;

    /**
     * Quem a cesta mostra: todo mundo da entidade menos quem já está na
     * formação, e menos o recorte do filtro.
     */
    const disponiveis = useMemo(() => {
        const noGrupo = new Set(
            grupoAberto?.integrantes.map(({ id }) => id) ?? [],
        );
        return integrantes.filter(({ id }) => !noGrupo.has(id));
    }, [integrantes, grupoAberto]);

    /**
     * O total que a barra anuncia: o da entidade menos quem saiu para a
     * formação do grupo.
     *
     * O desconto conta quem saiu *das páginas já carregadas*, e não a formação
     * inteira: o grupo pode ter gente que o backend ainda não devolveu, e
     * descontá-la faria a contagem cair sem ninguém ter saído da cesta.
     */
    const totalDisponiveis = total - (integrantes.length - disponiveis.length);

    const visiveis = useMemo(
        () => filtrarIntegrantes(disponiveis, filtros),
        [disponiveis, filtros],
    );

    const { hasNextPage, isFetchingNextPage, fetchNextPage } = lista;
    const carregarMais = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    /**
     * Inclui ou tira a pessoa da formação — é o clique no cartão. Mexe só no
     * rascunho; o resumo é recalculado por {@link grupoAberto}.
     */
    const alternarIntegrante = useCallback(
        (integrante: Integrante) => {
            setFormacao((rascunho) => {
                const atual = rascunho ?? salvo?.integrantes ?? [];
                const dentro = atual.some(({ id }) => id === integrante.id);
                return dentro
                    ? atual.filter(({ id }) => id !== integrante.id)
                    : [...atual, integrante];
            });
        },
        [salvo],
    );

    /**
     * Inclui de uma vez todo mundo que a coluna está mostrando — o atalho do
     * recorte do filtro.
     */
    const incluirVisiveis = useCallback(() => {
        if (visiveis.length === 0) return;
        setFormacao((rascunho) => [
            ...(rascunho ?? salvo?.integrantes ?? []),
            ...visiveis,
        ]);
    }, [salvo, visiveis]);

    return {
        grupoAberto,
        /** O detalhe ainda não chegou. */
        carregandoDetalhe: detalhe.isPending,
        erroDetalhe: detalhe.error,
        editarGrupo,
        excluirGrupo,
        alternarIntegrante,
        incluirVisiveis,
        formacaoMudou,
        salvarFormacao,

        integrantes: visiveis,
        /** Quantos a cesta mostraria sem o filtro — ver {@link totalDisponiveis}. */
        total: totalDisponiveis,
        /**
         * A entidade não tem ninguém cadastrado — diferente de "todo mundo já
         * está no grupo", que também zera a cesta. Quem mostra a mensagem
         * precisa distinguir as duas, e a contagem de disponíveis não basta.
         */
        entidadeVazia: total === 0,
        carregando: lista.isLoading,
        erro: lista.error,
        isFetchingNextPage,
        carregarMais,
        filtros,
        setFiltros,
    };
}
