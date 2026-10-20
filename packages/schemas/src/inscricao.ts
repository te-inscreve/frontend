import { z } from "zod/v4";

import { integranteSchema } from "./integrante";

/**
 * O corpo que `inscricao.create` vai receber: quem se apresenta na categoria.
 *
 * A inscrição não guarda grupo nenhum. Grupo é só um modelo de onde a tela
 * copia a formação; o que cruza a borda é a lista de ids das pessoas, seja lá
 * de onde elas vieram.
 *
 * `nomeConcorrente` é o nome com que a formação se apresenta, e só existe nas
 * modalidades em grupo que o exibem (`isGrupo` e `exibirNomeConcorrente`) —
 * aí ele é obrigatório; em qualquer outra, o backend recusa o campo.
 */
export const criarInscricaoSchema = z.object({
    nomeConcorrente: z.string().trim().min(1).max(255).optional(),
    integrantes: z.array(z.number().int()).min(1),
});

export type CriarInscricao = z.infer<typeof criarInscricaoSchema>;

/**
 * A entidade como ela vem dentro de uma inscrição (`EntidadeInscricaoSerializer`):
 * só a identidade pública e a cidade.
 */
const entidadeDaInscricaoSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    cidade: z.string(),
});

/**
 * Inscrição na modalidade individual: o concorrente é uma pessoa só.
 *
 * `concorrente` é `null` só num estado que o backend não deveria produzir —
 * uma inscrição sem integrante —, mas o serializer o admite.
 */
export const inscricaoIndividualSchema = z.object({
    id: z.number().int(),
    dataCriacao: z.string(),
    entidade: entidadeDaInscricaoSchema,
    concorrente: integranteSchema.nullable(),
    ordem: z.number().int(),
});

/**
 * Inscrição na modalidade em grupo, como vem na listagem: a formação é só a
 * contagem. `nomeConcorrente` só vem quando a modalidade o exibe
 * (`exibirNomeConcorrente`).
 */
export const inscricaoGrupoSchema = z.object({
    id: z.number().int(),
    dataCriacao: z.string(),
    entidade: entidadeDaInscricaoSchema,
    nomeConcorrente: z.string().optional(),
    totalIntegrantes: z.number().int(),
    ordem: z.number().int(),
});

/**
 * O que `POST .../inscricoes/` devolve: sempre uma lista. Na modalidade
 * individual, uma inscrição por pessoa enviada — o envio é um lote atômico;
 * na modalidade em grupo, uma só, a do grupo.
 */
export const inscricoesCriadasSchema = z.union([
    z.array(inscricaoIndividualSchema),
    z.array(inscricaoGrupoSchema),
]);

/**
 * O que `GET .../inscricoes/` devolve: as inscrições da categoria, no formato
 * da modalidade — todas individuais ou todas em grupo, nunca misturadas.
 */
export const inscricoesDaCategoriaSchema = inscricoesCriadasSchema;

export type InscricaoIndividual = z.infer<typeof inscricaoIndividualSchema>;
export type InscricaoGrupo = z.infer<typeof inscricaoGrupoSchema>;
export type InscricoesCriadas = z.infer<typeof inscricoesCriadasSchema>;
export type InscricoesDaCategoria = z.infer<typeof inscricoesDaCategoriaSchema>;
