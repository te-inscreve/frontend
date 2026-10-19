import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type {
    ModeloFichaDetalhe,
    ModeloFichaResumo,
} from "@te-inscreve/schemas";
import { criarModeloFichaSchema } from "@te-inscreve/schemas";

import { tagsFichasAvaliativas } from "../cache-tags";
import { authenticatedProcedure } from "../trpc";

export const fichaAvaliativaRouter = {
    getAll: authenticatedProcedure
        .input(
            z.object({
                search: z.string().trim().max(255).optional(),
            }),
        )
        .query(async ({ ctx }) => {
            const result = await ctx.restClient.get<ModeloFichaResumo[]>(
                "/fichas-avaliativas/modelos/",
                {
                    next: {
                        revalidate: 30,
                        tags: tagsFichasAvaliativas(),
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
    getById: authenticatedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<ModeloFichaDetalhe>(
                `/fichas-avaliativas/modelos/${input.id}/`,
                {
                    next: {
                        revalidate: 30,
                        tags: tagsFichasAvaliativas(input.id),
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
    /**
     * Cria um modelo de ficha da entidade de quem está logado — do zero, ou a
     * partir de `modeloFichaAvaliativaId` (nova versão de uma ficha da
     * entidade, ou cópia de uma global). Ver `criarModeloFichaSchema`.
     *
     * A entidade não vai no corpo: o backend a tira do usuário, e responde 403
     * a quem não tem uma. As recusas de composição — campo que não pertence à
     * ficha, composição protegida — chegam como uma lista solta, sem chave, e
     * caem em `fieldErrors[""]`.
     */
    criarModelo: authenticatedProcedure
        .input(criarModeloFichaSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<ModeloFichaDetalhe>(
                "/fichas-avaliativas/modelos/",
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
