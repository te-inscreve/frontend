import { z } from "zod/v4";

import type { FormCategoria } from "@te-inscreve/schemas";

import {
    inteiroNaoNegativo,
    inteiroPositivoOpcional,
} from "~/shared/utils/campos-numericos";

/**
 * Espelha o `formCategoriaSchema` de `@te-inscreve/schemas` na forma que a UI
 * manipula. Vive aqui, e não junto do formulário de modalidade, porque os dois
 * usam a mesma categoria: aninhada na criação da modalidade e sozinha na
 * página de criar categoria.
 */
export const categoriaFormSchema = z
    .object({
        nome: z.string().trim().min(1, "Informe o nome da categoria."),
        idadeMinima: inteiroNaoNegativo("Informe a idade mínima."),
        idadeMaxima: inteiroNaoNegativo("Informe a idade máxima."),
        maxInscricoes: inteiroPositivoOpcional(
            "O limite de inscrições precisa ser um número inteiro maior que zero.",
        ),
    })
    .refine((categoria) => categoria.idadeMaxima >= categoria.idadeMinima, {
        path: ["idadeMaxima"],
        error: "A idade máxima não pode ser menor que a mínima.",
    });

export type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;

export const categoriaFormDefaults: CategoriaFormValues = {
    nome: "",
    idadeMinima: 0,
    idadeMaxima: 0,
    maxInscricoes: null,
};

/** Converte o modelo de edição validado para o que a rota tRPC envia. */
export function categoriaFormInput(
    valores: CategoriaFormValues,
): FormCategoria {
    return categoriaFormSchema.parse(valores);
}
