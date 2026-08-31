import { z } from "zod/v4";

import { cpfSchema } from "./cpf";

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

/**
 * O que `/auth/registration/` recebe. Os nomes são os do backend (camelCase, já
 * que a API usa `djangorestframework-camel-case`) — a tradução para os rótulos
 * em português acontece no formulário.
 */
export const signUpSchema = z
    .object({
        email: z.email(),
        fullName: z.string().min(1),
        cpf: cpfSchema,
        password: z.string().min(8),
        passwordVerification: z.string().min(8),
    })
    .refine((dados) => dados.password === dados.passwordVerification, {
        path: ["passwordVerification"],
        error: "Password confirmation does not match.",
    });
export type SignUpInput = z.infer<typeof signUpSchema>;

export { cpfSchema, isValidCpf } from "./cpf";

export {
    createEventoSchema,
    eventoPreviewSchema,
    eventoSchema,
} from "./evento";
export type { CreateEventoInput, Evento, EventoPreview } from "./evento";

export {
    formModalidadeSchema as createModalidadeSchema,
    modalidadeDetalheSchema,
    modalidadePreviewSchema,
    modalidadeSchema,
} from "./modalidade";
export type {
    FormModalidade as CreateModalidade,
    Modalidade,
    ModalidadeDetalhe,
    ModalidadePreview,
} from "./modalidade";

export {
    categoriaAninhadaSchema,
    categoriaSchema,
    formCategoriaSchema,
} from "./categoria";
export type { Categoria, CategoriaAninhada, FormCategoria } from "./categoria";

export { privateEntidadeSchema, publicEntidadeSchema } from "./entidade";
export type { PrivateEntidade, PublicEntidade } from "./entidade";

export { perfilSchema } from "./perfil";
export type { Perfil } from "./perfil";
