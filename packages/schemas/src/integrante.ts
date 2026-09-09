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
 * O detalhe de um integrante (`/minha-entidade/integrantes/{id}`).
 *
 * `grupos` ainda não está implementado no backend: chega sempre vazio, e o
 * formato de cada item não foi definido — daí `unknown`. Quem for usar o
 * conteúdo precisa fechar o formato com o backend antes.
 */
export const integranteDetalheSchema = integranteSchema.extend({
    grupos: z.array(z.unknown()),
});

/**
 * O que o cadastro envia. Sai do mesmo schema sem o `id` — que é o recurso,
 * não um dado — e com os ids dos grupos, que o backend aceita mas ainda não
 * usa.
 */
export const formIntegranteSchema = integranteSchema.omit({ id: true }).extend({
    grupos: z.array(z.number().int()).default([]),
});

export const paginaIntegrantesSchema = paginadoSchema(integranteSchema);

export type Integrante = z.infer<typeof integranteSchema>;
export type IntegranteDetalhe = z.infer<typeof integranteDetalheSchema>;
export type FormIntegrante = z.infer<typeof formIntegranteSchema>;
export type PaginaIntegrantes = z.infer<typeof paginaIntegrantesSchema>;
