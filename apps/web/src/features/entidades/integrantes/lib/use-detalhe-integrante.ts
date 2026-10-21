"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/shared/api/trpc/client";

/**
 * O que o detalhe de uma pessoa busca além do cadastro: os grupos de que ela
 * faz parte, e o gesto de tirá-la de um.
 *
 * É um hook por modal, e não parte de `usePainelIntegrantes`: a leitura é por
 * pessoa, e só existe enquanto o detalhe está aberto — o conteúdo do
 * `ExpandableDialog` monta só com ele aberto, então a query nasce e morre
 * com o modal. O cabeçalho do modal pinta antes, com o que a lista já sabia;
 * é só a seção de grupos que espera.
 *
 * Tirar de um grupo invalida três leituras: este detalhe, a grade de grupos
 * (o total do cartão mudou) e o detalhe daquele grupo, se a tela de grupos o
 * tiver no cache.
 */
export function useDetalheIntegrante(id: number) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const detalhe = useQuery(trpc.integrante.getById.queryOptions({ id }));
    const remover = useMutation(trpc.grupo.removerIntegrante.mutationOptions());
    const [removendoDe, setRemovendoDe] = useState<number | null>(null);

    const removerDoGrupo = useCallback(
        async (grupoId: number) => {
            setRemovendoDe(grupoId);
            try {
                await remover.mutateAsync({ grupoId, integranteId: id });
                await Promise.all([
                    queryClient.invalidateQueries(
                        trpc.integrante.getById.queryFilter({ id }),
                    ),
                    queryClient.invalidateQueries(trpc.grupo.list.pathFilter()),
                    queryClient.invalidateQueries(
                        trpc.grupo.getById.queryFilter({ id: grupoId }),
                    ),
                ]);
            } finally {
                setRemovendoDe(null);
            }
        },
        [remover, id, queryClient, trpc],
    );

    return {
        grupos: detalhe.data?.grupos ?? [],
        carregandoGrupos: detalhe.isPending,
        erroGrupos: detalhe.error,
        removerDoGrupo,
        /** O grupo cujo vínculo está sendo desfeito agora, se algum. */
        removendoDe,
        erroAoRemover: remover.error,
    };
}
