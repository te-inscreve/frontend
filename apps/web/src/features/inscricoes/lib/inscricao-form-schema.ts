import { z } from "zod/v4";

import type { CriarInscricao, ModalidadeDetalhe } from "@te-inscreve/schemas";
import { integranteSchema } from "@te-inscreve/schemas";

import type { Integrante } from "~/features/entidades/shared/integrantes";

/**
 * A inscrição na forma que a UI manipula.
 *
 * O formulário guarda as pessoas inteiras, e não só os ids do
 * {@link criarInscricaoSchema}: o ticket desenha nome, idade e matrícula de
 * cada uma, e parte delas chega de `grupo.getById`, fora das páginas já
 * carregadas da lista. {@link inscricaoFormInput} reduz a lista aos ids na
 * hora de enviar.
 *
 * O nome do concorrente só é exigido quando a modalidade o pede — em grupo e
 * com `exibirNomeConcorrente` (ver {@link exigeNomeConcorrente}) —, por isso
 * uma fábrica, e não uma constante: quem decide é a modalidade.
 */
export function inscricaoFormSchema(exigeNome: boolean) {
    const nome = z
        .string()
        .trim()
        // O limite é o do `CharField` do backend.
        .max(255, "O nome pode ter no máximo 255 caracteres.");

    return z.object({
        nomeConcorrente: exigeNome
            ? nome.min(1, "Dê um nome ao concorrente.")
            : nome,
        integrantes: z
            .array(integranteSchema)
            .min(1, "Adicione ao menos um integrante à inscrição."),
    });
}

/**
 * Se a inscrição leva nome de concorrente. O backend exige o nome nessas
 * modalidades e o recusa em todas as outras — inclusive na modalidade em
 * grupo que não o exibe —, então a regra é uma só, aqui.
 */
export function exigeNomeConcorrente(
    modalidade: Pick<ModalidadeDetalhe, "isGrupo" | "exibirNomeConcorrente">,
) {
    return modalidade.isGrupo && modalidade.exibirNomeConcorrente;
}

export type InscricaoFormValues = z.infer<
    ReturnType<typeof inscricaoFormSchema>
>;

export const inscricaoFormDefaults: InscricaoFormValues = {
    nomeConcorrente: "",
    integrantes: [],
};

/**
 * Converte o formulário validado no corpo que a API recebe. Onde a
 * modalidade não pede nome, ele não vai, mesmo que um grupo aplicado o tenha
 * preenchido — o backend recusaria o campo.
 */
export function inscricaoFormInput(
    valores: InscricaoFormValues,
    exigeNome: boolean,
): CriarInscricao {
    return {
        ...(exigeNome && { nomeConcorrente: valores.nomeConcorrente.trim() }),
        integrantes: valores.integrantes.map(({ id }) => id),
    };
}

/** O clique num integrante: entra se não está, sai se está. */
export function alternarIntegrante(
    integrantes: Integrante[],
    integrante: Integrante,
): Integrante[] {
    return integrantes.some(({ id }) => id === integrante.id)
        ? integrantes.filter(({ id }) => id !== integrante.id)
        : [...integrantes, integrante];
}

/**
 * Aplica a formação de um grupo à inscrição: quem já estava fica, e quem é
 * do grupo entra no fim, sem repetir ninguém. O grupo não fica registrado em
 * lugar nenhum — depois de aplicado, são só pessoas.
 */
export function aplicarFormacao(
    integrantes: Integrante[],
    formacao: Integrante[],
): Integrante[] {
    const presentes = new Set(integrantes.map(({ id }) => id));
    return [...integrantes, ...formacao.filter(({ id }) => !presentes.has(id))];
}
