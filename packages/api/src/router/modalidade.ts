import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { Modalidade, ModalidadeDetalhe } from "@te-inscreve/schemas";
import {
    createModalidadeSchema,
    editModalidadeSchema,
} from "@te-inscreve/schemas";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const modalidadeRouter = {
    /**
     * Modalidades de um evento.
     *
     * O recurso é aninhado no backend, então o id do evento faz parte do
     * caminho — e um evento inexistente responde 404, que o middleware
     * converte em `NOT_FOUND`.
     */
    getAll: publicProcedure
        .input(z.object({ eventoId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<Modalidade[]>(
                `/eventos/${input.eventoId}/modalidades`,
                {
                    next: {
                        revalidate: 30, // 30 segundos
                        tags: [
                            "modalidades",
                            `evento-${input.eventoId}-modalidades`,
                        ],
                    },
                },
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
    /**
     * Detalhe de uma modalidade, com as categorias dela aninhadas — o que a
     * aba aberta mostra.
     *
     * As categorias vêm nesta mesma resposta, então abrir uma aba é uma
     * requisição só; `categoria.getAll` continua existindo para quem precisa
     * apenas da lista.
     */
    getById: publicProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.restClient.get<ModalidadeDetalhe>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}`,
                {
                    next: {
                        revalidate: 30, // 30 segundos
                        tags: [
                            "modalidades",
                            `evento-${input.eventoId}-modalidades`,
                            `modalidade-${input.modalidadeId}`,
                        ],
                    },
                },
            );

            // Aba apontando para modalidade que já não existe não é erro de
            // página: quem chama cai na primeira modalidade do evento.
            if (!result.ok) {
                if (result.status === 404) return null;
                throw result.error;
            }

            return result.data;
        }),

    /**
     * Altera as regras de uma modalidade que já existe.
     *
     * `PATCH` e não `PUT`: o serializer também expõe as categorias, e um envio
     * parcial evita mexer nelas — quem as edita é o CRUD de categoria.
     */
    update: authenticatedProcedure
        .input(
            z.object({
                eventoId: z.number().int().positive(),
                modalidadeId: z.number().int().positive(),
                modalidade: editModalidadeSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.patch<Modalidade>(
                `/eventos/${input.eventoId}/modalidades/${input.modalidadeId}/`,
                input.modalidade,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),

    /**
     * Cria a modalidade com as categorias dela na mesma requisição — o
     * backend aceita o aninhamento, então o organizador não precisa salvar a
     * modalidade antes de cadastrar as categorias.
     */
    create: authenticatedProcedure
        .input(createModalidadeSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.post<Modalidade>(
                `/eventos/${input.evento}/modalidades`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
