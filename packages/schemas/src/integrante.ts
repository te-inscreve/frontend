import { z } from "zod/v4";

import { paginadoSchema } from "./paginacao";

/**
 * O integrante da entidade, como vem de `/minha-entidade/integrantes`.
 *
 * As datas chegam em ISO (`aaaa-mm-dd`) e ficam como string: quem exibe ou
 * calcula idade converte na hora, sem o fuso do `new Date`.
 */
export const integranteSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    sobrenome: z.string(),
    /** Nascimento: é dele que sai a idade, e da idade a categoria. */
    dataNascimento: z.string(),
    /** Número da matrícula MTG — é ela que a comissão do evento confere. */
    matriculaMtg: z.string(),
    /**
     * Data em que a matrícula vence. Vencida, trava a inscrição. `null` para
     * quem foi cadastrado sem ela — o backend não a exige.
     */
    validade: z.string().nullable(),
});

/**
 * Um grupo visto de dentro do detalhe do integrante: só o que identifica o
 * grupo. O resto — formação, pendência, data — é da tela de grupos.
 */
export const grupoDoIntegranteSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    descricao: z.string(),
});

/**
 * O detalhe de um integrante (`/minha-entidade/integrantes/{id}`) — a única
 * leitura que diz de que grupos a pessoa faz parte.
 */
export const integranteDetalheSchema = integranteSchema.extend({
    grupos: z.array(grupoDoIntegranteSchema),
});

/**
 * O que o cadastro envia. Sai do mesmo schema sem o `id` — que é o recurso,
 * não um dado.
 *
 * `grupos` é opcional, e o formulário não o manda: o `update` é `PUT`, e um
 * `[]` ali tiraria a pessoa de todos os grupos a cada edição do cadastro. A
 * formação se muda pela tela de grupos.
 */
export const formIntegranteSchema = integranteSchema.omit({ id: true }).extend({
    grupos: z.array(z.number().int()).optional(),
});

export const paginaIntegrantesSchema = paginadoSchema(integranteSchema);

export type Integrante = z.infer<typeof integranteSchema>;
export type GrupoDoIntegrante = z.infer<typeof grupoDoIntegranteSchema>;
export type IntegranteDetalhe = z.infer<typeof integranteDetalheSchema>;
export type FormIntegrante = z.infer<typeof formIntegranteSchema>;
export type PaginaIntegrantes = z.infer<typeof paginaIntegrantesSchema>;
