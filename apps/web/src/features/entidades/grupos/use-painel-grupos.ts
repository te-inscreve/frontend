"use client";

import { useCallback, useMemo, useState } from "react";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import type { FormIntegrante } from "@te-inscreve/schemas";
import { proximaPagina } from "@te-inscreve/schemas";

import type { FormGrupo, GrupoDetalhe } from "./grupo";
import type { FiltrosIntegrantes } from "~/features/entidades/integrantes/filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    filtrarIntegrantes,
    filtrosVazios,
} from "~/features/entidades/integrantes/filtros-integrantes";
import { useTRPC } from "~/shared/api/trpc/client";
import { ErroDeCampoGrupo, nomeRepetido, resumirFormacao } from "./grupo";
import { gruposMock } from "./mock-grupos";

/** Quantos integrantes por página. O mesmo valor do `prefetch` da página. */
export const INTEGRANTES_POR_PAGINA = 20;

/**
 * Todo o estado da tela de grupos: a coluna de integrantes, a lista de grupos e
 * o grupo aberto.
 *
 * Está num hook porque as duas metades da tela se cruzam — incluir alguém muda
 * de lado um cartão da esquerda, e o grupo aberto decide se a coluna marca ou
 * abre detalhe — e porque é aqui que a tela conversa com os dados.
 *
 * As duas origens são diferentes de propósito. Os integrantes são de verdade:
 * `integrante.list`, query infinita, primeira página hidratada do servidor. Os
 * grupos são mock em memória (ver `mock-grupos.ts`): o backend já tem o recurso,
 * mas a rota tRPC ainda não existe, então criar, editar, excluir e mexer na
 * formação acontecem neste `useState` e se perdem no recarregamento. Quando a
 * rota existir, cada função daqui vira uma `mutation` seguida de invalidação —
 * os componentes não mudam.
 *
 * O grupo aberto é guardado por id, e não pelo objeto: assim a formação que a
 * tela mostra é sempre a da lista, e editar não deixa uma cópia velha em cena.
 */
export function usePainelGrupos() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [grupos, setGrupos] = useState<GrupoDetalhe[]>(gruposMock);
    const [abertoId, setAbertoId] = useState<number | null>(null);
    const [filtros, setFiltros] = useState<FiltrosIntegrantes>(filtrosVazios);

    const grupoAberto = useMemo(
        () => grupos.find((grupo) => grupo.id === abertoId) ?? null,
        [grupos, abertoId],
    );

    const lista = useInfiniteQuery(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: INTEGRANTES_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );

    const integrantes = useMemo(
        () => lista.data?.pages.flatMap((pagina) => pagina.items) ?? [],
        [lista.data],
    );
    const total = lista.data?.pages[0]?.totalItems ?? 0;

    /**
     * Quem a coluna da esquerda mostra.
     *
     * Com um grupo aberto, quem já está nele sai da coluna: a pessoa está do
     * outro lado da tela, na formação, e é de lá que ela volta. Ficar nos dois
     * lugares ao mesmo tempo tiraria o sentido do clique — e faria duas caixas
     * disputarem o mesmo `layoutId` da animação.
     *
     * O recorte do filtro vem depois, para a contagem da barra falar do que
     * está à vista.
     */
    const disponiveis = useMemo(() => {
        const noGrupo = new Set(
            grupoAberto?.integrantes.map(({ id }) => id) ?? [],
        );
        return integrantes.filter(({ id }) => !noGrupo.has(id));
    }, [integrantes, grupoAberto]);

    /**
     * O total que a barra anuncia: o da entidade menos quem saiu para a
     * formação do grupo aberto.
     *
     * O desconto conta quem saiu *das páginas já carregadas*, e não a formação
     * inteira: o grupo pode ter gente que o backend ainda não devolveu, e
     * descontá-la faria a contagem cair sem ninguém ter saído da coluna.
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
     * A edição de integrante que o detalhe da pessoa oferece — a única escrita
     * desta tela que chega na API de verdade.
     *
     * É a mesma de `usePainelIntegrantes`: o modal é o mesmo componente, e sem
     * isto ele abriria um formulário que não salva. `pathFilter`, e não
     * `queryFilter`, para a invalidação casar com a chave da query infinita.
     */
    const editar = useMutation(trpc.integrante.update.mutationOptions());
    const editarIntegrante = useCallback(
        async (id: number, dados: FormIntegrante) => {
            await editar.mutateAsync({ id, integrante: dados });

            await Promise.all([
                queryClient.invalidateQueries(
                    trpc.integrante.list.pathFilter(),
                ),
                queryClient.invalidateQueries(
                    trpc.integrante.getById.queryFilter({ id }),
                ),
            ]);
        },
        [editar, queryClient, trpc],
    );

    /**
     * Cria o grupo e já o abre: quem acabou de nomear um grupo vazio tem uma
     * coisa a fazer em seguida, que é colocar gente nele.
     *
     * O nome repetido é cobrado aqui porque é regra da entidade, e não do campo:
     * o schema não conhece os outros grupos. O backend tem a mesma restrição em
     * banco, e responde no mesmo formato — daí o erro sair com o campo a que
     * pertence, para o formulário mostrá-lo embaixo do nome.
     */
    const criarGrupo = useCallback(
        (dados: FormGrupo) => {
            if (nomeRepetido(grupos, dados.nome)) {
                throw new ErroDeCampoGrupo(
                    "nome",
                    "Já existe um grupo com esse nome na entidade.",
                );
            }

            // O id seria do backend; em memória, o maior mais um.
            const id = Math.max(0, ...grupos.map((grupo) => grupo.id)) + 1;
            const novo: GrupoDetalhe = {
                id,
                ...dados,
                dataCriacao: new Date().toISOString(),
                integrantes: [],
                ...resumirFormacao([]),
            };

            setGrupos((atuais) => [...atuais, novo]);
            setAbertoId(id);
        },
        [grupos],
    );

    const editarGrupo = useCallback(
        (id: number, dados: FormGrupo) => {
            if (nomeRepetido(grupos, dados.nome, id)) {
                throw new ErroDeCampoGrupo(
                    "nome",
                    "Já existe um grupo com esse nome na entidade.",
                );
            }

            setGrupos((atuais) =>
                atuais.map((grupo) =>
                    grupo.id === id ? { ...grupo, ...dados } : grupo,
                ),
            );
        },
        [grupos],
    );

    /** Exclui e volta para a grade: o detalhe aberto deixou de existir. */
    const excluirGrupo = useCallback((id: number) => {
        setGrupos((atuais) => atuais.filter((grupo) => grupo.id !== id));
        setAbertoId((aberto) => (aberto === id ? null : aberto));
    }, []);

    /**
     * Inclui ou tira a pessoa do grupo aberto — é o clique no cartão.
     *
     * Uma função para os dois sentidos porque é um só gesto: o cartão está de um
     * lado ou do outro, e clicar o manda para o lado oposto. O resumo é
     * recalculado junto, que é o que o backend devolveria no `PATCH`.
     */
    const alternarIntegrante = useCallback(
        (integrante: Integrante) => {
            setGrupos((atuais) =>
                atuais.map((grupo) => {
                    if (grupo.id !== abertoId) return grupo;

                    const dentro = grupo.integrantes.some(
                        ({ id }) => id === integrante.id,
                    );
                    const formacao = dentro
                        ? grupo.integrantes.filter(
                              ({ id }) => id !== integrante.id,
                          )
                        : [...grupo.integrantes, integrante];

                    return {
                        ...grupo,
                        integrantes: formacao,
                        ...resumirFormacao(formacao),
                    };
                }),
            );
        },
        [abertoId],
    );

    /**
     * Inclui de uma vez todo mundo que a coluna está mostrando.
     *
     * É o atalho do recorte: quem filtrou por "mirim" ou por uma faixa de idade
     * já separou exatamente quem entra no grupo, e clicar cartão por cartão
     * depois disso é refazer à mão o trabalho que o filtro fez.
     *
     * Age sobre a lista visível, e não sobre a entidade inteira — sem filtro,
     * "todos" é todo mundo que já carregou na coluna. Quem está no grupo nem
     * aparece lá, então não há o que duplicar.
     */
    const incluirVisiveis = useCallback(() => {
        setGrupos((atuais) =>
            atuais.map((grupo) => {
                if (grupo.id !== abertoId || visiveis.length === 0)
                    return grupo;

                const formacao = [...grupo.integrantes, ...visiveis];

                return {
                    ...grupo,
                    integrantes: formacao,
                    ...resumirFormacao(formacao),
                };
            }),
        );
    }, [abertoId, visiveis]);

    return {
        grupos,
        grupoAberto,
        abrirGrupo: setAbertoId,
        criarGrupo,
        editarGrupo,
        excluirGrupo,
        alternarIntegrante,
        incluirVisiveis,
        integrantes: visiveis,
        /** Quantos a coluna mostraria sem o filtro — ver {@link totalDisponiveis}. */
        total: totalDisponiveis,
        carregando: lista.isLoading,
        erro: lista.error,
        isFetchingNextPage,
        carregarMais,
        filtros,
        setFiltros,
        editarIntegrante,
    };
}
