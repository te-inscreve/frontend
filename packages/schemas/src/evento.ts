import { z } from "zod/v4";

import { publicEntidadeSchema } from "./entidade";
import { modalidadePreviewSchema } from "./modalidade";

/**
 * Reference domain schema. Mirrors what the REST API returns for an evento —
 * adjust the fields to match the real payload.
 */
export const eventoSchema = z.object({
    id: z.number().int(),
    // slug: z.string(),
    nome: z.string(),
    descricao: z.string(),
    dataInicio: z.string(),
    dataFim: z.string(),
    dataInicioInscricoes: z.string(),
    dataFimInscricoes: z.string(),
    unico: z.boolean(),
    local: z.string(),
    promotor: publicEntidadeSchema,
    /**
     * As modalidades do evento, só com id e nome. O detalhe de cada uma
     * (regras e categorias) vem de `modalidade.getById`, quando a aba abre.
     */
    modalidades: z.array(modalidadePreviewSchema),
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

/**
 * O que o organizador informa ao criar um evento. `id` e `slug` são gerados
 * pelo backend, e o `promotor` vem da entidade da sessão — nenhum dos três é
 * digitado no formulário.
 */
export const createEventoSchema = eventoSchema.omit({
    id: true,
    // slug: true,
    promotor: true,
    modalidades: true,
});

export const eventoPreviewSchema = eventoSchema.pick({
    id: true,
    nome: true,
    dataInicio: true,
    dataFim: true,
    local: true,
    logo: true,
    cartaz: true,
    situacao: true,
});

export type EventoPreview = z.infer<typeof eventoPreviewSchema>;
export type Evento = z.infer<typeof eventoSchema>;

export type CreateEventoInput = z.infer<typeof createEventoSchema>;
