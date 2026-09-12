"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

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
 * Está num hook porque as duas mãos da bancada se cruzam — incluir alguém tira
 * o cartão de um lado e o põe no outro, e o grupo aberto decide se a cesta de
 * integrantes existe — e porque é aqui que a tela conversa com os dados.
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

    const [grupos, setGrupos] = useState<GrupoDetalhe[]>(gruposMock);
    const [abertoId, setAbertoId] = useState<number | null>(null);
    const [filtros, setFiltros] = useState<FiltrosIntegrantes>(filtrosVazios);
    /**
     * Os ids da formação como ela estava da última vez que foi salva.
     *
     * É o que diz se há o que salvar: mexer na formação muda a lista do grupo,
     * e enquanto ela e esta aqui não baterem, existe mudança pendente. Guarda
     * só os ids porque é só a composição que o botão salva — nome e descrição
     * têm o diálogo do menu, que salva sozinho.
     */
    const [formacaoSalva, setFormacaoSalva] = useState<number[]>([]);

    const grupoAberto = useMemo(
        () => grupos.find((grupo) => grupo.id === abertoId) ?? null,
        [grupos, abertoId],
    );

    /**
     * Abre um grupo — ou volta para a grade, com `null`.
     *
     * Abrir é o marco zero do que há para salvar: a formação que está lá é a
     * que veio da API, então nada está pendente até alguém mexer.
     */
    const abrirGrupo = useCallback(
        (id: number | null) => {
            setAbertoId(id);
            setFormacaoSalva(
                grupos
                    .find((grupo) => grupo.id === id)
                    ?.integrantes.map(({ id: integranteId }) => integranteId) ??
                    [],
            );
        },
        [grupos],
    );

    /**
     * Se a formação do grupo aberto difere da última salva.
     *
     * Compara por conjunto, e não por posição: a ordem em que a gente entrou no
     * grupo não é dado nenhum, e ordená-la só para comparar faria o botão
     * acender por uma diferença que a tela não mostra.
     */
    const formacaoMudou = useMemo(() => {
        if (!grupoAberto) return false;
        if (grupoAberto.integrantes.length !== formacaoSalva.length)
            return true;

        const salvos = new Set(formacaoSalva);
        return grupoAberto.integrantes.some(({ id }) => !salvos.has(id));
    }, [grupoAberto, formacaoSalva]);

    /**
     * Salva a formação montada na bancada.
     *
     * Hoje só marca o que está em cena como salvo — é aqui que entra o
     * `PATCH` da formação quando a rota tRPC existir, antes da marcação, com a
     * invalidação da lista em seguida. Ver o cabeçalho deste arquivo: os grupos
     * ainda são mock em memória, e nada disto sobrevive a um recarregamento.
     */
    const salvarFormacao = useCallback(() => {
        if (!grupoAberto) return;
        setFormacaoSalva(grupoAberto.integrantes.map(({ id }) => id));
    }, [grupoAberto]);

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
     * Quem a cesta da esquerda mostra.
     *
     * Quem já está no grupo aberto sai da cesta: a pessoa está do outro lado da
     * bancada, na formação, e é de lá que ela volta. Ficar nos dois lugares ao
     * mesmo tempo tiraria o sentido do clique — e faria duas caixas disputarem o
     * mesmo `layoutId` da animação.
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
            // Nasce vazio e sem nada pendente — a formação começa aqui.
            setFormacaoSalva([]);
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
     * "todos" é todo mundo que já carregou na cesta. Quem está no grupo nem
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
        abrirGrupo,
        criarGrupo,
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
