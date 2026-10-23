import { format } from "date-fns";
import { z } from "zod/v4";

import type { Categoria, FormCategoria } from "@te-inscreve/schemas";

import {
    inteiroNaoNegativo,
    inteiroPositivoOpcional,
} from "~/shared/utils/campos-numericos";

/**
 * Espelha o `formCategoriaSchema` de `@te-inscreve/schemas` na forma que a UI
 * manipula. Vive aqui, e não junto do formulário de modalidade, porque os dois
 * usam a mesma categoria: aninhada na criação da modalidade e sozinha na
 * página de criar categoria.
 *
 * A apresentação, que a API trata como um instante só, aqui são dois campos:
 * o dia sai do calendário e o horário de um campo de hora. Os dois são
 * opcionais, mas andam juntos — um sem o outro não diz quando a categoria
 * começa.
 */
export const categoriaFormSchema = z
    .object({
        nome: z.string().trim().min(1, "Informe o nome da categoria."),
        idadeMinima: inteiroNaoNegativo("Informe a idade mínima."),
        idadeMaxima: inteiroNaoNegativo("Informe a idade máxima."),
        maxInscricoes: inteiroPositivoOpcional(
            "O limite de inscrições precisa ser um número inteiro maior que zero.",
        ),
        diaApresentacao: z.date().nullable(),
        horaApresentacao: z
            .string()
            .regex(/^(\d{2}:\d{2})?$/, "Informe um horário válido."),
    })
    .refine((categoria) => categoria.idadeMaxima >= categoria.idadeMinima, {
        path: ["idadeMaxima"],
        error: "A idade máxima não pode ser menor que a mínima.",
    })
    .refine(
        (categoria) =>
            categoria.diaApresentacao !== null ||
            categoria.horaApresentacao === "",
        {
            path: ["diaApresentacao"],
            error: "Escolha o dia da apresentação.",
        },
    )
    .refine(
        (categoria) =>
            categoria.diaApresentacao === null ||
            categoria.horaApresentacao !== "",
        {
            path: ["horaApresentacao"],
            error: "Informe o horário da apresentação.",
        },
    );

export type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;

export const categoriaFormDefaults: CategoriaFormValues = {
    nome: "",
    idadeMinima: 0,
    idadeMaxima: 0,
    maxInscricoes: null,
    diaApresentacao: null,
    horaApresentacao: "",
};

/** Preenche o formulário com uma categoria que já existe. */
export function categoriaFormValues(categoria: Categoria): CategoriaFormValues {
    const apresentacao = categoria.dataApresentacao
        ? new Date(categoria.dataApresentacao)
        : null;

    return {
        nome: categoria.nome,
        idadeMinima: categoria.idadeMinima,
        idadeMaxima: categoria.idadeMaxima,
        maxInscricoes: categoria.maxInscricoes,
        // O dia e o horário no fuso de quem edita — o mesmo em que eles foram
        // escolhidos, e o mesmo em que voltam a ser juntados no envio.
        diaApresentacao: apresentacao,
        horaApresentacao: apresentacao ? format(apresentacao, "HH:mm") : "",
    };
}

/** Converte o modelo de edição validado para o que a rota tRPC envia. */
export function categoriaFormInput(
    valores: CategoriaFormValues,
): FormCategoria {
    const { diaApresentacao, horaApresentacao, ...dados } =
        categoriaFormSchema.parse(valores);

    return {
        ...dados,
        dataApresentacao: diaApresentacao
            ? instante(diaApresentacao, horaApresentacao)
            : null,
    };
}

/**
 * Junta o dia do calendário e o horário digitado num instante ISO. O horário
 * é lido no fuso do navegador — o de quem está organizando o evento — e o
 * `toISOString` leva o instante já em UTC, sem ambiguidade para o backend.
 */
function instante(dia: Date, hora: string): string {
    const [horas, minutos] = hora.split(":").map(Number);
    const data = new Date(dia);
    data.setHours(horas ?? 0, minutos ?? 0, 0, 0);
    return data.toISOString();
}
