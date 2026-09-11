import { z } from "zod/v4";

import type { FormGrupo, GrupoDetalhe } from "./grupo";

/**
 * O cadastro de grupo na forma que a UI manipula.
 *
 * São dois campos, e os dois são texto: o grupo existe para dar nome a um
 * conjunto de pessoas. Quem entra nele não passa por aqui — a formação se monta
 * clicando na coluna de integrantes, com o grupo aberto, e não dentro de um
 * formulário. Assim criar um grupo é uma frase, e incluir gente é o trabalho
 * que vem depois, com a lista inteira à vista.
 */
export const grupoFormSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(1, "Informe o nome do grupo.")
        // O limite é o do `CharField` do backend; estourar aqui é erro de
        // digitação, não de regra.
        .max(255, "O nome pode ter no máximo 255 caracteres."),
    // Opcional de verdade: o backend aceita vazio, e "Conjunto Vocal" já se
    // explica. O limite existe para a descrição não virar ata de reunião no
    // cartão da grade.
    descricao: z
        .string()
        .trim()
        .max(500, "A descrição pode ter no máximo 500 caracteres."),
});

export type GrupoFormValues = z.infer<typeof grupoFormSchema>;

/** O formulário vazio, ou preenchido com o grupo em edição. */
export function grupoFormDefaults(grupo?: GrupoDetalhe): GrupoFormValues {
    return {
        nome: grupo?.nome ?? "",
        descricao: grupo?.descricao ?? "",
    };
}

/** Converte o formulário validado no corpo que a API recebe. */
export function grupoFormInput(valores: GrupoFormValues): FormGrupo {
    return grupoFormSchema.parse(valores);
}
