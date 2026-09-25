import { z } from "zod/v4";

/**
 * O corpo que `inscricao.create` vai receber: quem se apresenta na categoria.
 *
 * A inscrição não guarda grupo nenhum. Grupo é só um modelo de onde a tela
 * copia a formação; o que cruza a borda é a lista de ids das pessoas, seja lá
 * de onde elas vieram.
 *
 * `nomeConcorrente` é o nome com que a formação se apresenta, e só existe nas
 * modalidades em grupo (`isGrupo`) — nas individuais o concorrente é a própria
 * pessoa, e o campo não vai.
 */
export const criarInscricaoSchema = z.object({
    nomeConcorrente: z.string().trim().min(1).max(255).optional(),
    integrantes: z.array(z.number().int()).min(1),
});

export type CriarInscricao = z.infer<typeof criarInscricaoSchema>;
