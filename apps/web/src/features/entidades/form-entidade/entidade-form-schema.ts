import { z } from "zod/v4";

import type { FormEntidade, MinhaEntidade } from "@te-inscreve/schemas";

import { digitosTelefone, maskTelefone } from "~/shared/utils/format-telefone";

/**
 * O cadastro da entidade na forma que a UI manipula: tudo texto, e com as
 * máscaras que o usuário vê.
 *
 * O `formEntidadeSchema` de `@te-inscreve/schemas` descreve o que atravessa o
 * REST; este descreve o que o formulário segura enquanto está sendo
 * preenchido — daí o CNPJ e o telefone serem validados pela máscara, e não
 * pelo formato final.
 */
export const entidadeFormSchema = z.object({
    nome: z.string().trim().min(1, "Informe o nome da entidade."),
    cnpj: z
        .string()
        .regex(
            /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
            "Informe o CNPJ completo, com 14 dígitos.",
        ),
    telefone: z
        .string()
        .refine((valor) => [10, 11].includes(digitosTelefone(valor).length), {
            error: "Informe o telefone com DDD.",
        }),
    cidade: z.string().trim().min(1, "Informe a cidade."),
    estado: z.string().regex(/^[A-Z]{2}$/, "Selecione o estado."),
});

export type EntidadeFormValues = z.infer<typeof entidadeFormSchema>;

/** Preenche o formulário com o que a API devolveu. */
export function entidadeFormDefaults(
    entidade: MinhaEntidade,
): EntidadeFormValues {
    return {
        nome: entidade.nome,
        cnpj: entidade.cnpj,
        // A API guarda o telefone sem máscara; a edição mostra com.
        telefone: maskTelefone(entidade.telefone),
        cidade: entidade.cidade,
        estado: entidade.estado,
    };
}

/**
 * Converte o modelo de edição validado para o que a rota tRPC envia — cada
 * campo na forma em que a API o devolve: CNPJ mascarado, telefone só dígitos.
 */
export function entidadeFormInput(valores: EntidadeFormValues): FormEntidade {
    const { telefone, ...resto } = entidadeFormSchema.parse(valores);
    return { ...resto, telefone: digitosTelefone(telefone) };
}

/** As unidades federativas, para o campo de estado. */
export const estados = [
    "AC",
    "AL",
    "AM",
    "AP",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MG",
    "MS",
    "MT",
    "PA",
    "PB",
    "PE",
    "PI",
    "PR",
    "RJ",
    "RN",
    "RO",
    "RR",
    "RS",
    "SC",
    "SE",
    "SP",
    "TO",
].map((uf) => ({ valor: uf, rotulo: uf }));
