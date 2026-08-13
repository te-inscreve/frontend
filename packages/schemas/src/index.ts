import { z } from "zod/v4";

import { publicEntidadeSchema } from "./entidade";

/**
 * Schemas shared between the tRPC layer and both front-ends.
 *
 * Since there is no ORM to derive types from, this package is the single source
 * of truth for the shapes crossing the REST boundary. Define a schema here and
 * the inferred type flows through tRPC to the web and mobile clients.
 */

export const signInSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = signInSchema.extend({
    name: z.string().min(1),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

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
});
export type Evento = z.infer<typeof eventoSchema>;

export const createEventoSchema = eventoSchema.omit({ id: true });
export type CreateEventoInput = z.infer<typeof createEventoSchema>;
