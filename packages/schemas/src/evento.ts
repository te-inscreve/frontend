import { z } from "zod/v4";

import { publicEntidadeSchema } from "./entidade";

/**
 * Reference domain schema. Mirrors what the REST API returns for an evento —
 * adjust the fields to match the real payload.
 */
export const eventoSchema = z.object({
    id: z.number().int(),
    slug: z.string(),
    nome: z.string(),
    descricao: z.string(),
    dataInicio: z.string(),
    dataFim: z.string(),
    dataInicioInscricao: z.string(),
    dataFimInscricao: z.string(),
    unico: z.boolean(),
    local: z.string(),
    promotor: publicEntidadeSchema,
    logo: z.string().optional(),
    cartaz: z.string().optional(),
    regulamento: z.string().optional(),
    situacao: z
        .enum([
            "em-preparacao",
            "inscricoes-abertas",
            "em-andamento",
            "encerrado",
        ])
        .optional(),
});
export type Evento = z.infer<typeof eventoSchema>;

/**
 * O que o organizador informa ao criar um evento. `id` e `slug` são gerados
 * pelo backend, e o `promotor` vem da entidade da sessão — nenhum dos três é
 * digitado no formulário.
 */
export const createEventoSchema = eventoSchema.omit({
    id: true,
    slug: true,
    promotor: true,
});
export type CreateEventoInput = z.infer<typeof createEventoSchema>;
