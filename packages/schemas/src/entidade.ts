import { z } from "zod/v4";

// "nome": "CTG Potaria do Rio Grande",
// "cnpj": "12.345.678/0001-90",
// "telefone": "54996449436",
// "cidade": "Vacaria",
// "estado": "RS"
const entidadeSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
    // Sem máscara: a API devolve só os dígitos (`54996449436`), e quem exibe
    // formata na hora de mostrar.
    telefone: z.string(),
    cidade: z.string(),
    estado: z.string().regex(/^[A-Z]{2}$/),
});

/**
 * A entidade de quem está logado, como vem de `/minha-entidade`.
 *
 * Os dois totais são contagens que só esse recurso devolve — o backend as
 * calcula do lado dele para o painel não precisar buscar as listas inteiras
 * para dizer quantos são.
 */
export const minhaEntidadeSchema = entidadeSchema.extend({
    totalIntegrantes: z.number().int(),
    totalGrupos: z.number().int(),
});

/**
 * Os campos que a entidade edita do próprio cadastro.
 *
 * Sai do mesmo schema sem o `id` — que é o recurso, não um dado — e sem os
 * totais, que o backend calcula.
 */
export const formEntidadeSchema = minhaEntidadeSchema.omit({
    id: true,
    totalIntegrantes: true,
    totalGrupos: true,
});

/**
 * Uma entidade na listagem pública de `/entidades`.
 *
 * O backend serve só `id` e `nome` nesse recurso (`EntidadeListaSerializer`),
 * e não o cadastro inteiro: a lista é aberta, e CNPJ e telefone de toda
 * entidade não têm por que circular para quem só vai escolher uma num select.
 */
export const entidadeOpcaoSchema = entidadeSchema.pick({
    id: true,
    nome: true,
});

export type EntidadeOpcao = z.infer<typeof entidadeOpcaoSchema>;

export const privateEntidadeSchema = entidadeSchema;
export const publicEntidadeSchema = entidadeSchema.omit({ id: true });
export type PublicEntidade = z.infer<typeof publicEntidadeSchema>;
export type PrivateEntidade = z.infer<typeof privateEntidadeSchema>;
export type MinhaEntidade = z.infer<typeof minhaEntidadeSchema>;
export type FormEntidade = z.infer<typeof formEntidadeSchema>;
