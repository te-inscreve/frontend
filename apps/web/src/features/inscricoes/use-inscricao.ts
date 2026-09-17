"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { proximaPagina } from "@te-inscreve/schemas";

import type { PayloadInscricao, SelecaoInscricao } from "./selecao-inscricao";
import type { FiltrosGrupos } from "~/features/entidades/grupos/filtros-grupos";
import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import type { FiltrosIntegrantes } from "~/features/entidades/integrantes/filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    filtrarGrupos,
    filtrosGruposVazios,
} from "~/features/entidades/grupos/filtros-grupos";
import {
    filtrarIntegrantes,
    filtrosVazios,
} from "~/features/entidades/integrantes/filtros-integrantes";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    alternarIntegrante as alternar,
    escolherGrupo as escolher,
    montarPayload,
    montarTicket,
    selecaoVazia,
} from "./selecao-inscricao";

interface Opcoes {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    /** Os mesmos dos `prefetch` da página — a chave da query inclui o tamanho. */
    gruposPorPagina: number;
    integrantesPorPagina: number;
}

/**
 * O estado da página de criar inscrição: o que a entidade tem (grupos e
 * integrantes), o que a categoria exige, e a seleção sendo montada.
 *
 * Modelo de `use-detalhe-grupo.ts`. Seis leituras, todas hidratadas do
 * `prefetch` da página: a entidade (o nome do cabeçalho), a categoria e a
 * modalidade (o rodapé do ticket), as duas listas infinitas (as abas) e, sob
 * demanda, `grupo.getById` — a única que traz a formação, e que só dispara
 * quando um grupo é escolhido (`enabled`).
 *
 * A seleção é estado puro movido pelas funções de `selecao-inscricao.ts`; o
 * hook só as amarra ao React e deriva o que a tela lê — as linhas do ticket,
 * o conjunto de quem está marcado, o payload.
 *
 * Busca e filtros são do navegador, sobre as páginas já carregadas: nem
 * `grupo.list` nem `integrante.list` aceitam `search`. Cada aba guarda o
 * próprio filtro, e o filtro sobrevive à troca de aba porque mora aqui, não
 * na lista que desmonta.
 *
 * `criarInscricao` é mock: o backend ainda não expõe `inscricao.create`, então
 * o payload vai para o console e fica em `ultimoEnvio`. Quando a mutação
 * existir, é aqui que ela entra — a tela não muda.
 */
export function useInscricao({
    eventoId,
    modalidadeId,
    categoriaId,
    gruposPorPagina,
    integrantesPorPagina,
}: Opcoes) {
    const trpc = useTRPC();

    const [selecao, setSelecao] = useState<SelecaoInscricao>(selecaoVazia);
    const [filtrosIntegrantes, setFiltrosIntegrantes] =
        useState<FiltrosIntegrantes>(filtrosVazios);
    const [filtrosGrupos, setFiltrosGrupos] =
        useState<FiltrosGrupos>(filtrosGruposVazios);
    const [ultimoEnvio, setUltimoEnvio] = useState<PayloadInscricao | null>(
        null,
    );

    // ---- O contexto: entidade, categoria, modalidade ----------------------

    const entidade = useQuery(trpc.entidade.minha.queryOptions());
    const categoria = useQuery(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    const modalidade = useQuery(
        trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }),
    );

    // ---- A formação do grupo escolhido ------------------------------------

    const grupoEscolhido = selecao.grupo !== null;
    const detalheGrupo = useQuery({
        ...trpc.grupo.getById.queryOptions({ id: selecao.grupo?.id ?? 0 }),
        enabled: grupoEscolhido,
    });
    const integrantesDoGrupo = useMemo(
        () => (grupoEscolhido ? (detalheGrupo.data?.integrantes ?? []) : []),
        [grupoEscolhido, detalheGrupo.data],
    );
    const membrosDoGrupo = useMemo(
        () => new Set(integrantesDoGrupo.map(({ id }) => id)),
        [integrantesDoGrupo],
    );

    // ---- As listas --------------------------------------------------------

    const listaGrupos = useInfiniteQuery(
        trpc.grupo.list.infiniteQueryOptions(
            { pageSize: gruposPorPagina },
            { getNextPageParam: proximaPagina },
        ),
    );
    const grupos = useMemo(
        () => listaGrupos.data?.pages.flatMap((pagina) => pagina.items) ?? [],
        [listaGrupos.data],
    );
    const gruposVisiveis = useMemo(
        () => filtrarGrupos(grupos, filtrosGrupos),
        [grupos, filtrosGrupos],
    );
    // Desestruturados para o `useCallback` ter dependências estáveis: o
    // objeto da query muda a cada render, e a sentinela da lista observa o
    // ref de novo sempre que o callback troca.
    const {
        hasNextPage: temMaisGrupos,
        isFetchingNextPage: buscandoMaisGrupos,
        fetchNextPage: buscarMaisGrupos,
    } = listaGrupos;
    const carregarMaisGrupos = useCallback(() => {
        if (temMaisGrupos && !buscandoMaisGrupos) void buscarMaisGrupos();
    }, [temMaisGrupos, buscandoMaisGrupos, buscarMaisGrupos]);

    const listaIntegrantes = useInfiniteQuery(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: integrantesPorPagina },
            { getNextPageParam: proximaPagina },
        ),
    );
    const integrantes = useMemo(
        () =>
            listaIntegrantes.data?.pages.flatMap((pagina) => pagina.items) ??
            [],
        [listaIntegrantes.data],
    );
    const integrantesVisiveis = useMemo(
        () => filtrarIntegrantes(integrantes, filtrosIntegrantes),
        [integrantes, filtrosIntegrantes],
    );
    const {
        hasNextPage: temMaisIntegrantes,
        isFetchingNextPage: buscandoMaisIntegrantes,
        fetchNextPage: buscarMaisIntegrantes,
    } = listaIntegrantes;
    const carregarMaisIntegrantes = useCallback(() => {
        if (temMaisIntegrantes && !buscandoMaisIntegrantes) {
            void buscarMaisIntegrantes();
        }
    }, [temMaisIntegrantes, buscandoMaisIntegrantes, buscarMaisIntegrantes]);

    // ---- O ticket ---------------------------------------------------------

    const linhasDoTicket = useMemo(
        () => montarTicket(selecao, integrantesDoGrupo),
        [selecao, integrantesDoGrupo],
    );
    /** Quem está no ticket agora — é o que marca os cartões da lista. */
    const selecionados = useMemo(
        () => new Set(linhasDoTicket.map(({ integrante }) => integrante.id)),
        [linhasDoTicket],
    );
    const payload = useMemo(
        () => montarPayload(selecao, membrosDoGrupo),
        [selecao, membrosDoGrupo],
    );

    // ---- As ações ---------------------------------------------------------

    const escolherGrupo = useCallback(
        (grupo: GrupoComPrevia) =>
            setSelecao((atual) => escolher(atual, grupo)),
        [],
    );

    const alternarIntegrante = useCallback(
        (integrante: Integrante) =>
            setSelecao((atual) => alternar(atual, integrante, membrosDoGrupo)),
        [membrosDoGrupo],
    );

    /** Mock até `inscricao.create` existir: registra o payload e o guarda. */
    const criarInscricao = useCallback(() => {
        console.info("[inscricao] payload", payload);
        setUltimoEnvio(payload);
    }, [payload]);

    return {
        entidade: entidade.data ?? null,
        categoria: categoria.data ?? null,
        modalidade: modalidade.data ?? null,

        grupos: {
            itens: gruposVisiveis,
            total: listaGrupos.data?.pages[0]?.totalItems ?? 0,
            carregando: listaGrupos.isLoading,
            erro: listaGrupos.error,
            isFetchingNextPage: buscandoMaisGrupos,
            carregarMais: carregarMaisGrupos,
            filtros: filtrosGrupos,
            setFiltros: setFiltrosGrupos,
        },
        integrantes: {
            itens: integrantesVisiveis,
            total: listaIntegrantes.data?.pages[0]?.totalItems ?? 0,
            carregando: listaIntegrantes.isLoading,
            erro: listaIntegrantes.error,
            isFetchingNextPage: buscandoMaisIntegrantes,
            carregarMais: carregarMaisIntegrantes,
            filtros: filtrosIntegrantes,
            setFiltros: setFiltrosIntegrantes,
        },

        selecao,
        grupoDetalhe: {
            integrantes: integrantesDoGrupo,
            /** Há grupo escolhido e a formação dele ainda não chegou. */
            carregando: grupoEscolhido && detalheGrupo.isPending,
        },
        linhasDoTicket,
        selecionados,
        payload,
        ultimoEnvio,

        escolherGrupo,
        alternarIntegrante,
        criarInscricao,
    };
}
