import type { RefinementCtx } from "zod/v4";
import { z } from "zod/v4";

import type { CreateModalidade, EditModalidade } from "@te-inscreve/schemas";

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

/**
 * Os campos da modalidade em si, sem as categorias. Ficam separados porque a
 * criação e a edição pedem coisas diferentes: criando, a modalidade nasce com
 * as categorias junto; editando, elas já existem e têm telas próprias.
 */
const camposModalidadeSchema = z.object({
    nome: z.string().trim().min(1, "Informe o nome da modalidade."),
    // Opcional: a modalidade pode nascer só com o nome, pelo cadastro rápido,
    // e ganhar a descrição depois. O backend exige o campo, então o vazio
    // atravessa a borda como string vazia, e não como ausência.
    descricao: z.string().trim(),
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
});

export type ModalidadeCamposValues = z.infer<typeof camposModalidadeSchema>;

/**
 * Os dois limites por grupo só existem quando a modalidade é em grupo — e,
 * quando existem, o backend rejeita um mínimo maior que o máximo.
 */
function validarLimitesDeGrupo(
    modalidade: ModalidadeCamposValues,
    ctx: RefinementCtx,
) {
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
}

/** Criação: a modalidade e as categorias que nascem com ela. */
export const modalidadeFormSchema = camposModalidadeSchema
    .extend({
        categorias: z
            .array(categoriaFormSchema)
            .min(1, "Cadastre pelo menos uma categoria."),
    })
    .superRefine(validarLimitesDeGrupo);

/** Edição: só as regras da modalidade — as categorias são editadas à parte. */
export const modalidadeEdicaoFormSchema = camposModalidadeSchema.superRefine(
    validarLimitesDeGrupo,
);

/**
 * Cadastro rápido: só o nome. É o mesmo campo do formulário completo, com a
 * mesma mensagem — o que muda é tudo o que fica de fora.
 */
export const modalidadeRapidaFormSchema = camposModalidadeSchema.pick({
    nome: true,
});

export type ModalidadeFormValues = z.infer<typeof modalidadeFormSchema>;
export type ModalidadeRapidaFormValues = z.infer<
    typeof modalidadeRapidaFormSchema
>;

export const modalidadeCamposDefaults: ModalidadeCamposValues = {
    nome: "",
    descricao: "",
    planilhaAberta: false,
    maxPosicaoPremiada: 3,
    isGrupo: false,
    minInscritosPorGrupo: null,
    maxInscritosPorGrupo: null,
    maxInscricoesEntidadePorCategoria: null,
};

export const modalidadeFormDefaults: ModalidadeFormValues = {
    ...modalidadeCamposDefaults,
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
        ...limitesDeGrupo(dados),
    };
}

/**
 * O mesmo para o cadastro rápido: o nome informado, as regras no padrão do
 * formulário completo e nenhuma categoria. A modalidade entra na lista de
 * abas na hora, e as categorias e as regras são detalhadas depois — cada uma
 * na sua tela.
 */
export function modalidadeRapidaInput(
    valores: ModalidadeRapidaFormValues,
    eventoId: number,
): CreateModalidade {
    const { nome } = modalidadeRapidaFormSchema.parse(valores);

    return {
        ...modalidadeCamposDefaults,
        nome,
        evento: eventoId,
        categorias: [],
    };
}

/** O mesmo para a edição, onde o `evento` e as categorias não vão no corpo. */
export function modalidadeEdicaoInput(
    valores: ModalidadeCamposValues,
): EditModalidade {
    const dados = modalidadeEdicaoFormSchema.parse(valores);

    return { ...dados, ...limitesDeGrupo(dados) };
}

/**
 * Uma modalidade individual não tem grupo: se o organizador preencheu os
 * limites e depois desligou a chave, os valores não vão junto.
 */
function limitesDeGrupo(dados: ModalidadeCamposValues) {
    return {
        minInscritosPorGrupo: dados.isGrupo ? dados.minInscritosPorGrupo : null,
        maxInscritosPorGrupo: dados.isGrupo ? dados.maxInscritosPorGrupo : null,
    };
}
