import { z } from "zod/v4";

import { categoriaAninhadaSchema, formCategoriaSchema } from "./categoria";

/**
 * Modalidade de um evento — a representação plana que `ModalidadeSerializer`
 * devolve. `evento` vem como o id do pai, não como o objeto.
 *
 * Os três campos anuláveis são opcionais no backend: `min/maxInscritosPorGrupo`
 * só existem quando `isGrupo`, e o limite por entidade é opcional sempre.
 */
export const modalidadeSchema = z.object({
    id: z.number().int(),
    evento: z.number().int(),
    nome: z.string(),
    descricao: z.string(),
    planilhaAberta: z.boolean(),
    maxPosicaoPremiada: z.number().int(),
    isGrupo: z.boolean(),
    minInscritosPorGrupo: z.number().int().nullable(),
    maxInscritosPorGrupo: z.number().int().nullable(),
    maxInscricoesEntidadePorCategoria: z.number().int().nullable(),
    exibirNomeConcorrente: z.boolean(),
});

/**
 * O par id/nome que o evento traz na lista `modalidades`. É o bastante para
 * montar as abas — o resto só chega quando a aba abre e o detalhe é buscado.
 */
export const modalidadePreviewSchema = modalidadeSchema.pick({
    id: true,
    nome: true,
});

/**
 * Detalhe de uma modalidade: os campos dela mais as categorias aninhadas, que
 * vêm na mesma resposta e dispensam uma segunda requisição.
 */
export const modalidadeDetalheSchema = modalidadeSchema.extend({
    categorias: z.array(categoriaAninhadaSchema),
});

/**
 * Campos que a edição de uma modalidade envia. As categorias ficam de fora —
 * elas já existem e têm CRUD próprio, então repeti-las aqui sobrescreveria a
 * lista — e o `evento` também: o dono da modalidade não muda.
 */
export const editModalidadeSchema = modalidadeSchema.omit({
    id: true,
    evento: true,
});

export const formModalidadeSchema = modalidadeSchema
    .omit({
        id: true,
    })
    .extend({
        categorias: z.array(formCategoriaSchema),
    });

export type Modalidade = z.infer<typeof modalidadeSchema>;
export type ModalidadePreview = z.infer<typeof modalidadePreviewSchema>;
export type ModalidadeDetalhe = z.infer<typeof modalidadeDetalheSchema>;
export type FormModalidade = z.infer<typeof formModalidadeSchema>;
export type EditModalidade = z.infer<typeof editModalidadeSchema>;
