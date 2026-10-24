import { z } from "zod/v4";

/**
 * O payload de envio de uma avaliação — o que o `POST` de avaliações recebe —,
 * e também o que o app guarda na avaliação atual e na fila (TE-98): com ele e o
 * modelo de ficha, a avaliação se remonta na tela.
 *
 * Estrito como o backend: chave desconhecida é 400 lá. Cada resposta leva um
 * conteúdo só, conforme o tipo do campo: `valorNumerico` no numérico,
 * `valorTexto` no descritivo e na observação, `alternativaId` na alternativa
 * única e `alternativaIds` na múltipla. Resposta em branco não vai: o campo
 * fica fora da lista.
 *
 * `campoFichaId` é o `id` da posição na ficha (o item de `camposGerais` ou de
 * `agrupamentos[].campos`), não o do campo. Cada agrupamento aparece
 * exatamente `quantidade` vezes, com `ordem` de 1 a `quantidade` e um `nome`.
 */

const idSchema = z.number().int().min(1);

/** Decimal não negativo com exatamente 4 casas, como `"8.5000"`. */
const VALOR_NUMERICO = /^\d+\.\d{4}$/;

export const respostaEnvioSchema = z.union([
    z.strictObject({
        campoFichaId: idSchema,
        valorNumerico: z.string().regex(VALOR_NUMERICO),
    }),
    z.strictObject({
        campoFichaId: idSchema,
        valorTexto: z.string().refine((texto) => texto.trim().length > 0),
    }),
    z.strictObject({ campoFichaId: idSchema, alternativaId: idSchema }),
    z.strictObject({
        campoFichaId: idSchema,
        alternativaIds: z.array(idSchema).min(1),
    }),
]);

export const ocorrenciaEnvioSchema = z.strictObject({
    agrupamentoId: idSchema,
    ordem: idSchema,
    nome: z.string().trim().min(1).max(255),
    respostas: z.array(respostaEnvioSchema),
});

export const envioAvaliacaoSchema = z.strictObject({
    modeloFichaAvaliativaId: idSchema,
    respostasGerais: z.array(respostaEnvioSchema),
    agrupamentos: z.array(ocorrenciaEnvioSchema),
});

export type RespostaEnvio = z.infer<typeof respostaEnvioSchema>;
export type OcorrenciaEnvio = z.infer<typeof ocorrenciaEnvioSchema>;

/**
 * O payload como o app o guarda. Tem a forma do envio, mas o da avaliação
 * atual pode estar incompleto ou inválido — um numérico que não normaliza
 * fica como foi digitado (`"1,23456"`), para não se perder ao reabrir. Só o envio passa
 * pelo `envioAvaliacaoSchema`.
 */
export type EnvioAvaliacao = z.infer<typeof envioAvaliacaoSchema>;
