import { z } from "zod/v4";

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

export type { Evento, CreateEventoInput } from "./evento";
export { eventoSchema, createEventoSchema } from "./evento";
