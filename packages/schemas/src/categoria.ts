import { z } from "zod/v4";

/**
 * Categoria de uma modalidade — o que `CategoriaSerializer` devolve.
 *
 * `avaliadores` é a quantidade de avaliadores da categoria, não a lista deles.
 * Ele e `maxInscricoes` são nulos quando o organizador não definiu limite.
 */
export const categoriaSchema = z.object({
    id: z.number().int(),
    modalidade: z.number().int(),
    nome: z.string(),
    idadeMinima: z.number().int(),
    idadeMaxima: z.number().int(),
    avaliadores: z.number().int().nullable(),
    maxInscricoes: z.number().int().nullable(),
});
export type Categoria = z.infer<typeof categoriaSchema>;
