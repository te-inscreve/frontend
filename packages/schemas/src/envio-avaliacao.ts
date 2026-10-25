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

/**
 * O 201 do `POST` de avaliações: a avaliação como o servidor a gravou. Só o
 * que o app usa é conferido; o resto do detalhe (as respostas devolvidas)
 * passa sem validar. `nota` é calculada pelo backend, decimal em string com 4
 * casas (`"8.7500"`).
 */
export const avaliacaoEnviadaSchema = z.looseObject({
    id: z.number().int(),
    inscricaoId: z.number().int(),
    avaliadorId: z.number().int(),
    modeloFichaAvaliativaId: z.number().int(),
    /** ISO 8601 com fuso. */
    dataEnvio: z.string(),
    nota: z.string(),
});

/**
 * Um problema do 400 do `POST`, com onde ele está. Para marcar o erro no
 * formulário: `local` + `agrupamentoId`/`ordem` + `campoFichaId`.
 */
export const erroDeEnvioLocalizadoSchema = z.object({
    local: z.string(),
    /** Texto legível; pode citar nomes de campo em snake_case. */
    mensagem: z.string(),
    campoFichaId: z.number().int().optional(),
    agrupamentoId: z.number().int().optional(),
    ordem: z.number().int().optional(),
    indiceAgrupamento: z.number().int().optional(),
    indiceResposta: z.number().int().optional(),
});

/** O corpo do 400: o backend valida tudo e devolve todos os problemas. */
export const errosDeEnvioSchema = z.object({
    erros: z.array(erroDeEnvioLocalizadoSchema),
});

/**
 * Quem enviou a avaliação, na listagem e no detalhe. `nome` e `sobrenome` são
 * os do usuário e podem vir vazios — usuário criado fora do cadastro não os
 * tem —; o `username` sempre vem, e é a identificação de reserva.
 */
export const avaliadorSchema = z.object({
    id: z.number().int(),
    username: z.string(),
    nome: z.string(),
    sobrenome: z.string(),
});

/**
 * Uma avaliação de `GET .../inscricoes/{id}/avaliacoes/`, a consulta que
 * separa o 409 de "já avaliou" dos outros (TE-68).
 */
export const avaliacaoDaInscricaoSchema = z.object({
    id: z.number().int(),
    avaliadorId: z.number().int(),
    avaliador: avaliadorSchema,
    modeloFichaAvaliativaId: z.number().int(),
    dataEnvio: z.string(),
    nota: z.string(),
});

export type AvaliacaoEnviada = z.infer<typeof avaliacaoEnviadaSchema>;
export type ErroDeEnvioLocalizado = z.infer<typeof erroDeEnvioLocalizadoSchema>;
export type AvaliacaoDaInscricao = z.infer<typeof avaliacaoDaInscricaoSchema>;
export type Avaliador = z.infer<typeof avaliadorSchema>;

/**
 * Uma resposta como o detalhe a devolve: `campoFichaId` e exatamente um
 * conteúdo, conforme o tipo do campo — as outras chaves nem vêm. O numérico
 * volta sempre com 4 casas (`"8.0000"`). Sem a rigidez do envio: chave nova
 * na resposta não deve derrubar a leitura.
 */
export const respostaAvaliacaoSchema = z.union([
    z.object({ campoFichaId: z.number().int(), valorNumerico: z.string() }),
    z.object({ campoFichaId: z.number().int(), valorTexto: z.string() }),
    z.object({
        campoFichaId: z.number().int(),
        alternativaId: z.number().int(),
    }),
    z.object({
        campoFichaId: z.number().int(),
        alternativaIds: z.array(z.number().int()),
    }),
]);

/**
 * `GET .../inscricoes/{id}/avaliacoes/{id}/`: a avaliação enviada, com todas
 * as respostas — o mesmo corpo do 201 do `POST`. Só traz ids e valores:
 * rótulos, tipos e alternativas vêm do modelo `modeloFichaAvaliativaId`.
 *
 * Campo opcional deixado em branco não aparece em `respostas`. `dataEnvio` é
 * UTC; os agrupamentos vêm na ordem da ficha e depois por `ordem`.
 */
export const avaliacaoDetalheSchema = z.object({
    id: z.number().int(),
    inscricaoId: z.number().int(),
    avaliadorId: z.number().int(),
    avaliador: avaliadorSchema,
    modeloFichaAvaliativaId: z.number().int(),
    dataEnvio: z.string(),
    nota: z.string(),
    respostasGerais: z.array(respostaAvaliacaoSchema),
    agrupamentos: z.array(
        z.object({
            agrupamentoId: z.number().int(),
            ordem: z.number().int(),
            nome: z.string(),
            respostas: z.array(respostaAvaliacaoSchema),
        }),
    ),
});

export type RespostaAvaliacao = z.infer<typeof respostaAvaliacaoSchema>;
export type AvaliacaoDetalhe = z.infer<typeof avaliacaoDetalheSchema>;
