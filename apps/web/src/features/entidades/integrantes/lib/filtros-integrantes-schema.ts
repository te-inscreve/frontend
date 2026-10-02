import { z } from "zod/v4";

/** Idade em anos completos; `null` é a ponta aberta, que não filtra. */
const idade = z
    .number()
    .int()
    .min(0, "A idade não pode ser negativa.")
    .nullable();

/**
 * Os recortes da listagem de integrantes, na forma que o formulário de
 * filtro manipula.
 *
 * O recorte é por idade, e não por data de nascimento: a pergunta que a
 * entidade faz é "quem se enquadra na categoria", e categoria se define por
 * idade. Converter uma na outra é conta que ninguém deveria ter de fazer.
 *
 * A faixa invertida é cobrada no objeto, e não em cada ponta: enquanto se
 * digita, nenhuma limita a outra — com a máxima amarrada à mínima, o primeiro
 * dígito de "40" depois de "20" já seria recusado. O erro cai na máxima, que
 * é a ponta que se corrige.
 */
export const filtrosIntegrantesSchema = z
    .object({
        /** Trecho do nome. Vazio não filtra nada. */
        nome: z.string(),
        idadeMinima: idade,
        idadeMaxima: idade,
        /** Só quem está com a matrícula vencida — o que trava a inscrição. */
        somenteVencidas: z.boolean(),
    })
    .refine(
        ({ idadeMinima, idadeMaxima }) =>
            idadeMinima === null ||
            idadeMaxima === null ||
            idadeMaxima >= idadeMinima,
        {
            message: "A idade máxima precisa ser maior ou igual à mínima.",
            path: ["idadeMaxima"],
        },
    );

export type FiltrosIntegrantes = z.infer<typeof filtrosIntegrantesSchema>;
