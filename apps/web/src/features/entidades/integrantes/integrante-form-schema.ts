import { z } from "zod/v4";

import type { FormIntegrante, Integrante } from "@te-inscreve/schemas";

import {
    dataDeISO,
    dividirNome,
    nomeCompleto,
    paraISO,
} from "~/features/entidades/shared/integrantes";

/**
 * O cadastro de integrante na forma que a UI manipula: datas como `Date` — é
 * o que o calendário devolve —, o nome numa caixa só, e tudo que pode estar
 * vazio como `null`, inclusive o que é obrigatório: o campo nasce vazio e é o
 * Zod que cobra.
 *
 * O contrato com a API é o `formIntegranteSchema` de `@te-inscreve/schemas`;
 * este é só o que é da tela, e `integranteFormInput` traduz um no outro.
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
        // Um campo só, dividido em nome e sobrenome no envio: é assim que o
        // nome está escrito na carteirinha que a pessoa tem na mão, e dois
        // campos faziam parar no meio para decidir onde cortar.
        nomeCompleto: z
            .string()
            .trim()
            .min(1, "Informe o nome completo.")
            // Sobrenome não é firula: é ele que distingue duas pessoas na
            // planilha da comissão do evento.
            .refine((valor) => dividirNome(valor).sobrenome.length > 0, {
                error: "Informe também o sobrenome.",
            }),
        matriculaMtg: z
            .string()
            .trim()
            .min(1, "Informe o número da matrícula MTG."),
        dataNascimento: dataObrigatoria("Informe a data de nascimento."),
        validade: z.custom<Date | null>().nullable(),
    })
    .refine(
        ({ dataNascimento }) => !dataNascimento || dataNascimento <= new Date(),
        {
            path: ["dataNascimento"],
            error: "A data de nascimento não pode estar no futuro.",
        },
    );

export type IntegranteFormValues = z.infer<typeof integranteFormSchema>;

/**
 * O formulário vazio, ou preenchido com o integrante em edição.
 */
export function integranteFormDefaults(
    integrante?: Integrante,
): IntegranteFormValues {
    if (!integrante) {
        return {
            nomeCompleto: "",
            matriculaMtg: "",
            dataNascimento: null,
            validade: null,
        };
    }

    return {
        nomeCompleto: nomeCompleto(integrante),
        matriculaMtg: integrante.matriculaMtg,
        dataNascimento: dataDeISO(integrante.dataNascimento),
        validade: integrante.validade ? dataDeISO(integrante.validade) : null,
    };
}

/**
 * Converte o formulário validado no que a rota tRPC envia. `grupos` vai
 * vazio: o backend aceita o campo, mas o cadastro ainda não vincula ninguém.
 */
export function integranteFormInput(
    valores: IntegranteFormValues,
): FormIntegrante {
    const dados = integranteFormSchema.parse(valores);
    const { validade, dataNascimento } = dados;

    if (!dataNascimento) {
        throw new Error(
            "Integrante sem data de nascimento — o schema deveria ter barrado.",
        );
    }

    // O `parse` acima já garantiu que sobra sobrenome depois do corte.
    const { nome, sobrenome } = dividirNome(dados.nomeCompleto);

    return {
        nome,
        sobrenome,
        matriculaMtg: dados.matriculaMtg,
        dataNascimento: paraISO(dataNascimento),
        validade: validade ? paraISO(validade) : null,
        grupos: [],
    };
}
