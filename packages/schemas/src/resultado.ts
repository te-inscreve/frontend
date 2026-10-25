import { z } from "zod/v4";

/**
 * Uma linha da classificação pública de uma categoria, como
 * `GET .../categorias/{id}/resultados/` a devolve.
 *
 * Quem se apresentou vem conforme a modalidade, como na listagem de
 * inscrições: `concorrente` só na individual (nulo na inscrição sem
 * integrante); `nomeConcorrente` só na em grupo que o exibe — sem ele, a
 * chave nem vem. Os dois nunca aparecem juntos.
 *
 * `notaFinal` é a média das avaliações, decimal em string com 4 casas,
 * truncada (`"9.3333"`); nula enquanto a inscrição não tem avaliação.
 */
export const resultadoCategoriaSchema = z.object({
    id: z.number().int(),
    nomeEntidade: z.string(),
    concorrente: z
        .object({ nome: z.string(), sobrenome: z.string() })
        .nullish(),
    nomeConcorrente: z.string().optional(),
    notaFinal: z.string().nullable(),
});

/**
 * A classificação inteira, já ordenada pelo backend da maior para a menor
 * nota, com as sem nota no fim — não se reordena no cliente. Vazia tanto na
 * categoria ainda não encerrada quanto na encerrada sem inscrições: quem
 * distingue as duas é a `situacao` da categoria.
 */
export const resultadosCategoriaSchema = z.array(resultadoCategoriaSchema);

export type ResultadoCategoria = z.infer<typeof resultadoCategoriaSchema>;
export type ResultadosCategoria = z.infer<typeof resultadosCategoriaSchema>;
