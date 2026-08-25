import { z } from "zod/v4";

import { formCategoriaSchema } from "./categoria";

/**
 * Modalidade de um evento — a representação plana que `ModalidadeSerializer`
 * devolve. `evento` vem como o id do pai, não como o objeto.
 *
 * Os três campos anuláveis são opcionais no backend: `min/maxInscritosPorGrupo`
 * só existem quando `isGrupo`, e o limite por entidade é opcional sempre.
 */
export const modalidadeSchema = z.object({
    id: z.number().int(),
    evento: z.number().int(),
    nome: z.string(),
    descricao: z.string(),
    planilhaAberta: z.boolean(),
    maxPosicaoPremiada: z.number().int(),
    isGrupo: z.boolean(),
    minInscritosPorGrupo: z.number().int().nullable(),
    maxInscritosPorGrupo: z.number().int().nullable(),
    maxInscricoesEntidadePorCategoria: z.number().int().nullable(),
});

export const formModalidadeSchema = modalidadeSchema
    .omit({
        id: true,
    })
    .extend({
        categorias: z.array(formCategoriaSchema),
    });

export type Modalidade = z.infer<typeof modalidadeSchema>;
export type FormModalidade = z.infer<typeof formModalidadeSchema>;
