import { z } from "zod/v4";

import { entidadeDaInscricaoSchema } from "./inscricao";
import { integranteSchema } from "./integrante";

/**
 * Uma inscrição que o avaliador avaliou, como
 * `GET .../categorias/{id}/avaliadores/` a devolve.
 *
 * Quem se apresentou segue a modalidade, como na classificação:
 * `concorrente` só na individual; `nomeConcorrente` só na em grupo que o
 * exibe — sem ele, a chave nem vem.
 *
 * `nota` é a nota **desse avaliador**, decimal em string com 4 casas
 * (`"8.5000"`) — não a média final, que sai de `/resultados/`. Inscrição
 * cancelada continua aqui se já tinha sido avaliada.
 */
export const inscricaoAvaliadaSchema = z.object({
    id: z.number().int(),
    entidade: entidadeDaInscricaoSchema,
    concorrente: integranteSchema.nullish(),
    nomeConcorrente: z.string().nullish(),
    nota: z.string(),
});

/**
 * Quem já avaliou alguma inscrição da categoria. `nome` é nome e sobrenome
 * juntos, e vem `""` quando o usuário não preencheu o cadastro. As inscrições
 * vêm na ordem em que as avaliações foram criadas.
 */
export const avaliadorDaCategoriaSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    inscricoes: z.array(inscricaoAvaliadaSchema),
});

/**
 * Os avaliadores da categoria, em ordem crescente de `id`. Sai em qualquer
 * situação da categoria; vazia enquanto ninguém avaliou.
 */
export const avaliadoresDaCategoriaSchema = z.array(avaliadorDaCategoriaSchema);

export type InscricaoAvaliada = z.infer<typeof inscricaoAvaliadaSchema>;
export type AvaliadorDaCategoria = z.infer<typeof avaliadorDaCategoriaSchema>;
export type AvaliadoresDaCategoria = z.infer<
    typeof avaliadoresDaCategoriaSchema
>;
