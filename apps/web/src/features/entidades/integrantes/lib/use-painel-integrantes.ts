"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import type { FormIntegrante } from "@te-inscreve/schemas";
import { proximaPagina } from "@te-inscreve/schemas";

import type { Visualizacao } from "../visualizacao";
import type { FiltrosIntegrantes } from "./filtros-integrantes";
import { useTRPC } from "~/shared/api/trpc/client";
import { filtrosVazios } from "./filtros-integrantes";

/**
 * O parâmetro que já traz o cadastro aberto na chegada.
 *
 * É o que o "Cadastrar" do vazio da lista do painel da entidade aponta: de lá
 * não dá para abrir o diálogo, que vive nesta tela, então o pedido viaja pela
 * URL. Só a presença importa — o valor é ignorado.
 */
const PARAM_NOVO = "novo";

/**
 * Todo o estado da tela de integrantes: a lista, o recorte, a visualização e o
 * formulário.
 *
 * Está num hook, e não espalhado pelos componentes, porque as peças se cruzam —
 * cadastrar limpa o filtro para a pessoa nova aparecer — e porque é aqui que a
 * lista conversa com a API.
 *
 * A lista é uma query infinita: a primeira página vem hidratada do servidor, e
 * as seguintes chegam por `carregarMais`, que o painel liga à sentinela do fim
 * da lista. O `ref` da sentinela fica com o painel, e não aqui: um objeto que
 * carrega um ref é tratado inteiro como ref pelo lint do React, e nada mais
 * dele poderia ser lido no render.
 * Depois de criar ou editar, a query é invalidada inteira — o React Query
 * rebusca as páginas já abertas, na ordem, e a pessoa aparece onde a API a
 * colocou.
 *
 * O filtro ainda é só estado: ver `filtros-integrantes.ts`.
 *
 * A visualização não é lembrada entre visitas: a tela sempre abre em cartões.
 * Guardá-la exigiria o servidor saber da escolha antes do primeiro render, ou
 * a lista piscaria na visualização errada ao hidratar — ver `docs/fcp.md`.
 */
export function usePainelIntegrantes({ pageSize }: { pageSize: number }) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [filtros, setFiltros] = useState<FiltrosIntegrantes>(filtrosVazios);
    const [visualizacao, setVisualizacao] = useState<Visualizacao>("cartoes");
    // A URL é lida uma vez, na montagem: depois disso quem manda no diálogo é
    // o estado, e o parâmetro já saiu de cena.
    const params = useSearchParams();
    const [formAberto, setAberto] = useState(() => params.has(PARAM_NOVO));

    /**
     * Abre e fecha o cadastro, tirando da URL o pedido que o abriu.
     *
     * Sem a limpeza o `?novo` ficaria para trás: quem desistisse e recarregasse
     * — ou voltasse pelo histórico — encontraria o formulário aberto de novo,
     * sem ter pedido.
     *
     * `history.replaceState`, e não `router.replace`: só a URL muda, e o
     * segundo buscaria de novo o RSC da rota inteira por causa disso.
     */
    const setFormAberto = useCallback((aberto: boolean) => {
        setAberto(aberto);
        if (aberto) return;

        const url = new URL(window.location.href);
        if (!url.searchParams.has(PARAM_NOVO)) return;

        url.searchParams.delete(PARAM_NOVO);
        window.history.replaceState(null, "", url);
    }, []);

    const lista = useInfiniteQuery(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize },
            { getNextPageParam: proximaPagina },
        ),
    );

    const integrantes = useMemo(
        () => lista.data?.pages.flatMap((pagina) => pagina.items) ?? [],
        [lista.data],
    );
    const total = lista.data?.pages[0]?.totalItems ?? 0;

    const { hasNextPage, isFetchingNextPage, fetchNextPage } = lista;
    const carregarMais = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // `pathFilter`, e não `queryFilter`: o segundo marca a chave com
    // `type: "query"`, que não casa com a query infinita desta tela — a
    // invalidação passava sem atingir nada. Pelo caminho, cai tanto a lista
    // daqui quanto o preview do painel, que lê a mesma rota como query comum.
    const invalidarLista = useCallback(
        () => queryClient.invalidateQueries(trpc.integrante.list.pathFilter()),
        [queryClient, trpc],
    );

    const criar = useMutation(trpc.integrante.create.mutationOptions());
    const editar = useMutation(trpc.integrante.update.mutationOptions());

    /**
     * Cadastra o integrante e devolve a lista ao estado em que ele aparece.
     *
     * O formulário espera o retorno desta função e só fecha o diálogo quando
     * ela termina bem — se ela lançar, o que foi digitado continua na tela com
     * a mensagem do erro. Por isso o erro não é tratado aqui.
     */
    const adicionarIntegrante = useCallback(
        async (dados: FormIntegrante) => {
            await criar.mutateAsync(dados);

            await invalidarLista();
            // O total de integrantes do cabeçalho do painel também mudou.
            await queryClient.invalidateQueries(
                trpc.entidade.minha.queryFilter(),
            );

            // Sem limpar o filtro, o cadastro pareceria não ter funcionado:
            // a pessoa recém-criada quase nunca casa com o recorte em uso.
            setFiltros(filtrosVazios);
            setFormAberto(false);
        },
        [criar, invalidarLista, queryClient, trpc, setFormAberto],
    );

    /** Edita e rebusca: a lista e o detalhe repintam com o que a API guardou. */
    const editarIntegrante = useCallback(
        async (id: number, dados: FormIntegrante) => {
            await editar.mutateAsync({ id, integrante: dados });

            await Promise.all([
                invalidarLista(),
                queryClient.invalidateQueries(
                    trpc.integrante.getById.queryFilter({ id }),
                ),
            ]);
        },
        [editar, invalidarLista, queryClient, trpc],
    );

    return {
        integrantes,
        total,
        isLoading: lista.isLoading,
        error: lista.error,
        isFetchingNextPage,
        carregarMais,
        filtros,
        setFiltros,
        visualizacao,
        setVisualizacao,
        formAberto,
        setFormAberto,
        adicionarIntegrante,
        editarIntegrante,
    };
}
