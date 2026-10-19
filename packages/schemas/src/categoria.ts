import { z } from "zod/v4";

/**
 * Situação de uma categoria. O backend devolve um objeto: `value` é o que a
 * lógica compara, `label` é o texto pronto para mostrar.
 */
export const situacaoCategoriaSchema = z.object({
    value: z.enum([
        "aberta",
        "fechada",
        "pronta_avaliacao",
        "cancelada",
        "encerrada",
    ]),
    label: z.string(),
});

/**
 * O que o endpoint de situação recebe: a ação, e não a situação de destino.
 * `abrir` leva a `aberta`, `fechar` a `fechada`, e assim por diante.
 */
export const acaoSituacaoCategoriaSchema = z.enum([
    "abrir",
    "fechar",
    "cancelar",
    "encerrar",
    "liberar_avaliacao",
]);

export type SituacaoCategoria = z.infer<typeof situacaoCategoriaSchema>;
export type AcaoSituacaoCategoria = z.infer<typeof acaoSituacaoCategoriaSchema>;

/**
 * As transições que o backend aceita, a partir da situação atual. Cancelada e
 * encerrada são finais; pedir a ação da situação em que a categoria já está é
 * rejeitado, então ela nunca aparece na própria lista.
 *
 * A avaliação só é liberada com as inscrições fechadas, e dali a categoria só
 * segue para encerrada. O backend também exige uma ficha avaliativa vinculada;
 * essa regra não está aqui e volta como erro da ação.
 */
export const acoesPorSituacaoCategoria: Record<
    SituacaoCategoria["value"],
    readonly AcaoSituacaoCategoria[]
> = {
    aberta: ["fechar", "cancelar", "encerrar"],
    fechada: ["abrir", "liberar_avaliacao", "cancelar", "encerrar"],
    pronta_avaliacao: ["encerrar"],
    cancelada: [],
    encerrada: [],
};

/**
 * Categoria de uma modalidade — o que `CategoriaSerializer` devolve.
 *
 * `avaliadores` é a quantidade de avaliadores da categoria, não a lista deles.
 * Ele e `maxInscricoes` são nulos quando o organizador não definiu limite.
 *
 * `dataApresentacao` é o instante em que a categoria se apresenta, em ISO 8601
 * com fuso — nulo enquanto o cronograma não foi fechado.
 */
export const categoriaSchema = z.object({
    id: z.number().int(),
    modalidade: z.number().int(),
    nome: z.string(),
    idadeMinima: z.number().int(),
    idadeMaxima: z.number().int(),
    avaliadores: z.number().int().nullable(),
    maxInscricoes: z.number().int().nullable(),
    countInscricoes: z.number().int(),
    dataApresentacao: z.iso.datetime({ offset: true }).nullable(),
    situacao: situacaoCategoriaSchema,
});

/**
 * Categoria como o detalhe a devolve: a mesma da listagem e mais o que só faz
 * sentido para quem está olhando — `canInscrever` diz se a entidade do usuário
 * ainda pode se inscrever nela, ou se já tem inscrição.
 */
export const categoriaDetalheSchema = categoriaSchema.extend({
    canInscrever: z.boolean(),
});

/**
 * Categoria como ela chega aninhada no detalhe da modalidade: sem `id` e sem
 * `modalidade`, porque os dois são redundantes ali — a modalidade é o objeto
 * que a contém.
 */
export const categoriaAninhadaSchema = categoriaSchema.omit({
    modalidade: true,
});

/**
 * Categoria em criação. Sai do mesmo schema sem os campos que o organizador
 * não informa: o `id` e a `modalidade` — que, num cadastro aninhado, ainda não
 * existe quando a categoria é preenchida — e `avaliadores` e
 * `countInscricoes`, que o backend calcula a partir dos avaliadores e das
 * inscrições vinculados à categoria. A `situacao` também fica de fora: o
 * backend a ignora na criação e no `PATCH`, e ela só muda pelo endpoint
 * próprio de situação.
 */
export const formCategoriaSchema = categoriaSchema.omit({
    id: true,
    modalidade: true,
    avaliadores: true,
    countInscricoes: true,
    situacao: true,
});

export type Categoria = z.infer<typeof categoriaSchema>;
export type CategoriaAninhada = z.infer<typeof categoriaAninhadaSchema>;
export type CategoriaDetalhe = z.infer<typeof categoriaDetalheSchema>;
export type FormCategoria = z.infer<typeof formCategoriaSchema>;
