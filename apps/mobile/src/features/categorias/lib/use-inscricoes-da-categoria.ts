import { useQuery } from "@tanstack/react-query";

import type { InscricoesDaCategoria } from "@te-inscreve/schemas";

import { trpc } from "~/utils/api";

/**
 * As inscrições da categoria na ordem de apresentação (`ordem`), que é a
 * ordem em que o avaliador as encontra.
 */
export function useInscricoesDaCategoria(input: {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}) {
    return useQuery({
        ...trpc.inscricao.getAll.queryOptions(input),
        select: ordenarPorOrdem,
    });
}

function ordenarPorOrdem(inscricoes: InscricoesDaCategoria) {
    // A resposta é toda de um formato só, então reordenar mantém o tipo.
    return [...inscricoes].sort(
        (a, b) => a.ordem - b.ordem,
    ) as InscricoesDaCategoria;
}
