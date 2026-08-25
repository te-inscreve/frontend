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

/**
 * Categoria em criação. Sai do mesmo schema sem os campos que o organizador
 * não informa: o `id` e a `modalidade` — que, num cadastro aninhado, ainda não
 * existe quando a categoria é preenchida — e `avaliadores`, que o backend
 * calcula a partir dos avaliadores vinculados à categoria.
 */
export const formCategoriaSchema = categoriaSchema.omit({
    id: true,
    modalidade: true,
    avaliadores: true,
});

export type Categoria = z.infer<typeof categoriaSchema>;
export type FormCategoria = z.infer<typeof formCategoriaSchema>;
