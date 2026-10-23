import { z } from "zod/v4";

import { isValidCpf } from "@te-inscreve/schemas";

/**
 * Espelha o `signUpSchema` de `@te-inscreve/schemas` (a fonte de verdade do que
 * cruza a borda REST), mas com os nomes e as mensagens que a UI usa: os campos
 * são exibidos em português e o backend só fala inglês nas falhas.
 */
export const signUpFormSchema = z
    .object({
        email: z.email("Informe um e-mail válido."),
        nomeCompleto: z
            .string()
            .trim()
            .min(1, "Informe seu nome completo.")
            .refine(
                (nome) => nome.includes(" "),
                "Informe o nome e o sobrenome.",
            ),
        cpf: z
            .string()
            .min(1, "Informe seu CPF.")
            .regex(
                /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                "Informe os 11 dígitos do CPF.",
            )
            .refine(isValidCpf, "CPF inválido. Confira os números digitados."),
        senha: z
            .string()
            .min(1, "Crie uma senha.")
            .min(8, "A senha deve ter ao menos 8 caracteres."),
        confirmacaoSenha: z.string().min(1, "Repita a senha."),
    })
    .refine((dados) => dados.senha === dados.confirmacaoSenha, {
        path: ["confirmacaoSenha"],
        error: "As senhas não são iguais.",
    });

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
