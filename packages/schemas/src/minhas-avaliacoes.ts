import { z } from "zod/v4";

import { entidadeDaInscricaoSchema } from "./inscricao";
import { integranteSchema } from "./integrante";

/**
 * Uma avaliação que o usuário logado enviou e o servidor aceitou, como
 * `GET /minhas-avaliacoes/` a devolve.
 *
 * Quem se apresentou vem conforme a modalidade, como na listagem de
 * inscrições: `concorrente` (o primeiro integrante, nulo se não há) só na
 * individual; `nomeConcorrente` só na em grupo que o exibe. `nota` é decimal
 * em string com 4 casas (`"8.7500"`).
 */
export const minhaAvaliacaoSchema = z.object({
    id: z.number().int(),
    inscricaoId: z.number().int(),
    avaliadorId: z.number().int(),
    modeloFichaAvaliativaId: z.number().int(),
    /** ISO 8601 com fuso. */
    dataEnvio: z.string(),
    nota: z.string(),
    entidade: entidadeDaInscricaoSchema,
    nomeConcorrente: z.string().nullish(),
    concorrente: integranteSchema.nullish(),
});

/**
 * O histórico de avaliações do usuário logado, na árvore evento → modalidade
 * → categoria. Só os ramos com ao menos uma avaliação dele; sem paginação.
 */
export const minhasAvaliacoesSchema = z.array(
    z.object({
        id: z.number().int(),
        nome: z.string(),
        modalidades: z.array(
            z.object({
                id: z.number().int(),
                nome: z.string(),
                categorias: z.array(
                    z.object({
                        id: z.number().int(),
                        nome: z.string(),
                        avaliacoes: z.array(minhaAvaliacaoSchema),
                    }),
                ),
            }),
        ),
    }),
);

export type MinhaAvaliacao = z.infer<typeof minhaAvaliacaoSchema>;
export type MinhasAvaliacoes = z.infer<typeof minhasAvaliacoesSchema>;
