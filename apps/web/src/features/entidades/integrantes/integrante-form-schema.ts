import { z } from "zod/v4";

import type { Integrante } from "~/features/entidades/shared/integrantes";

/**
 * O cadastro de integrante na forma que a UI manipula: datas como `Date` — é
 * o que o calendário devolve — e tudo que pode estar vazio como `null`,
 * inclusive o que é obrigatório: o campo nasce vazio e é o Zod que cobra.
 *
 * O schema é local à feature porque o backend ainda não tem contrato para
 * integrante. Quando tiver, as regras de domínio sobem para
 * `packages/schemas` e aqui fica só o que é da tela.
 */

/**
 * O retorno é anotado como `boolean` de propósito: sem a anotação o TypeScript
 * deduz um type predicate, o Zod estreita a saída para `Date` e o formulário
 * passa a ter tipos de entrada e saída diferentes — que o `FormProvider`
 * compartilhado não representa. Aqui os dois lados são `Date | null`, e quem
 * envia é que confere.
 */
const dataObrigatoria = (mensagem: string) =>
    z.custom<Date | null>().refine((data): boolean => data !== null, {
        error: mensagem,
    });

export const integranteFormSchema = z
    .object({
        nome: z
            .string()
            .trim()
            .min(1, "Informe o nome completo.")
            // Sobrenome não é firula: é ele que distingue duas pessoas na
            // planilha da comissão do evento.
            .refine((nome) => nome.split(/\s+/).length > 1, {
                error: "Informe o nome completo, com sobrenome.",
            }),
        matriculaCtg: z
            .string()
            .trim()
            .min(1, "Informe o número da matrícula CTG."),
        dataNascimento: dataObrigatoria("Informe a data de nascimento."),
        validadeMatricula: z.custom<Date | null>().nullable(),
    })
    .refine(
        ({ dataNascimento }) => !dataNascimento || dataNascimento <= new Date(),
        {
            path: ["dataNascimento"],
            error: "A data de nascimento não pode estar no futuro.",
        },
    );

export type IntegranteFormValues = z.infer<typeof integranteFormSchema>;

export const integranteFormDefaults: IntegranteFormValues = {
    nome: "",
    matriculaCtg: "",
    validadeMatricula: null,
    dataNascimento: null,
};

/** ISO local (`aaaa-mm-dd`) — `toISOString` deslocaria a data pelo fuso. */
function paraISO(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Converte o formulário validado no integrante que a lista guarda. O id fica
 * de fora: enquanto não há API, quem atribui é quem conhece a lista inteira.
 */
export function integranteFormInput(
    valores: IntegranteFormValues,
): Omit<Integrante, "id"> {
    const dados = integranteFormSchema.parse(valores);
    const { validadeMatricula, dataNascimento } = dados;

    if (!validadeMatricula || !dataNascimento) {
        throw new Error(
            "Integrante sem as datas obrigatórias — o schema deveria ter barrado.",
        );
    }

    return {
        nome: dados.nome,
        matriculaCtg: dados.matriculaCtg,
        validadeMatricula: paraISO(validadeMatricula),
        dataNascimento: paraISO(dataNascimento),
    };
}
