import { z } from "zod/v4";

import type { CreateModalidade } from "@te-inscreve/schemas";

import {
    categoriaFormDefaults,
    categoriaFormSchema,
} from "~/features/categorias/form-categoria/categoria-form-schema";
import {
    inteiroNaoNegativo,
    inteiroPositivoOpcional,
} from "~/shared/utils/campos-numericos";

/**
 * Espelha o `createModalidadeSchema` de `@te-inscreve/schemas` (a fonte de
 * verdade do que cruza a borda REST), mas na forma que a UI manipula: os
 * limites opcionais são `null` enquanto o campo está vazio e o `evento` não
 * aparece — ele vem da rota, não do organizador.
 */

export const modalidadeFormSchema = z
    .object({
        nome: z.string().trim().min(1, "Informe o nome da modalidade."),
        descricao: z
            .string()
            .trim()
            .min(1, "Escreva uma descrição da modalidade."),
        planilhaAberta: z.boolean(),
        maxPosicaoPremiada: inteiroNaoNegativo(
            "Informe quantas posições são premiadas.",
        ),
        isGrupo: z.boolean(),
        minInscritosPorGrupo: inteiroPositivoOpcional(
            "O mínimo por grupo precisa ser um número inteiro maior que zero.",
        ),
        maxInscritosPorGrupo: inteiroPositivoOpcional(
            "O máximo por grupo precisa ser um número inteiro maior que zero.",
        ),
        maxInscricoesEntidadePorCategoria: inteiroPositivoOpcional(
            "O limite por entidade precisa ser um número inteiro maior que zero.",
        ),
        categorias: z
            .array(categoriaFormSchema)
            .min(1, "Cadastre pelo menos uma categoria."),
    })
    // Os dois limites por grupo só existem quando a modalidade é em grupo — e,
    // quando existem, o backend rejeita um mínimo maior que o máximo.
    .superRefine((modalidade, ctx) => {
        if (!modalidade.isGrupo) return;

        const { minInscritosPorGrupo: minimo, maxInscritosPorGrupo: maximo } =
            modalidade;

        if (minimo === null) {
            ctx.addIssue({
                code: "custom",
                path: ["minInscritosPorGrupo"],
                message: "Informe o mínimo de inscritos por grupo.",
            });
        }

        if (maximo === null) {
            ctx.addIssue({
                code: "custom",
                path: ["maxInscritosPorGrupo"],
                message: "Informe o máximo de inscritos por grupo.",
            });
        }

        if (minimo !== null && maximo !== null && maximo < minimo) {
            ctx.addIssue({
                code: "custom",
                path: ["maxInscritosPorGrupo"],
                message: "O máximo não pode ser menor que o mínimo.",
            });
        }
    });

export type ModalidadeFormValues = z.infer<typeof modalidadeFormSchema>;

export const modalidadeFormDefaults: ModalidadeFormValues = {
    nome: "",
    descricao: "",
    planilhaAberta: false,
    maxPosicaoPremiada: 3,
    isGrupo: false,
    minInscritosPorGrupo: null,
    maxInscritosPorGrupo: null,
    maxInscricoesEntidadePorCategoria: null,
    categorias: [categoriaFormDefaults],
};

/**
 * Converte o modelo de edição validado para o input da rota tRPC. Manter a
 * conversão junto do schema evita que o componente replique o contrato do
 * `evento` — que vem da rota — ou esqueça de limpar os limites de grupo.
 */
export function modalidadeFormInput(
    valores: ModalidadeFormValues,
    eventoId: number,
): CreateModalidade {
    const dados = modalidadeFormSchema.parse(valores);

    return {
        ...dados,
        evento: eventoId,
        // Uma modalidade individual não tem grupo: se o organizador preencheu
        // os limites e depois desligou a chave, os valores não vão junto.
        minInscritosPorGrupo: dados.isGrupo ? dados.minInscritosPorGrupo : null,
        maxInscritosPorGrupo: dados.isGrupo ? dados.maxInscritosPorGrupo : null,
    };
}
