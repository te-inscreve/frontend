import { z } from "zod/v4";

/**
 * Modelo de ficha avaliativa — o que `/fichas-avaliativas/modelos/` recebe e
 * devolve.
 *
 * Uma ficha é uma lista de posições: os `camposGerais`, avaliados uma vez, e os
 * `agrupamentos`, cujos campos se repetem `quantidade` vezes (um por jurado,
 * por par, por item). Cada posição aponta para um campo — global, do catálogo
 * do backend, ou exclusivo da ficha.
 *
 * Os schemas de entrada são estritos como o backend: chave desconhecida, em
 * qualquer nível, é 400 lá. Rejeitar aqui antes poupa a ida.
 */

export const tipoCampoFichaSchema = z.enum([
    "NUMERICO",
    "ALTERNATIVA_UNICA",
    "ALTERNATIVA_MULTIPLA",
    "DESCRITIVO",
    "OBSERVACAO",
]);

/**
 * Os tipos de escolha: o avaliador marca uma alternativa na única, quantas
 * quiser na múltipla. As alternativas têm a mesma forma nos dois; só o `tipo`
 * diz qual controle usar — nunca a quantidade de alternativas.
 */
export const TIPOS_COM_ALTERNATIVAS = [
    "ALTERNATIVA_UNICA",
    "ALTERNATIVA_MULTIPLA",
] as const satisfies readonly z.infer<typeof tipoCampoFichaSchema>[];

export type TipoCampoComAlternativas = (typeof TIPOS_COM_ALTERNATIVAS)[number];

export function aceitaAlternativas(
    tipo: z.infer<typeof tipoCampoFichaSchema>,
): tipo is TipoCampoComAlternativas {
    return (TIPOS_COM_ALTERNATIVAS as readonly string[]).includes(tipo);
}

/** O que a nota de um campo numérico faz com o total: soma ou desconta. */
export const modificadorNotaSchema = z.enum(["SOMA", "DESCONTA"]);

const idSchema = z.number().int().min(1);
const ordemSchema = z.number().int().min(1);

/**
 * A `ordem` é a posição na coleção, então não se repete dentro dela. Coleções
 * diferentes — os campos de dois agrupamentos — podem repetir. Campos gerais e
 * agrupamentos são a exceção: dividem uma sequência só, a do topo da ficha
 * (ver `ordensDoTopoUnicas`).
 */
const ordensUnicas = (itens: { ordem: number }[]) =>
    new Set(itens.map((item) => item.ordem)).size === itens.length;

const ORDEM_DUPLICADA = "ordem duplicado na coleção.";

/**
 * Campos gerais e agrupamentos se intercalam no topo da ficha: um agrupamento
 * pode vir entre dois campos gerais. Por isso a `ordem` de um não repete a de
 * nenhum outro, de qualquer das duas coleções.
 */
const ordensDoTopoUnicas = (modelo: {
    camposGerais?: { ordem: number }[];
    agrupamentos?: { ordem: number }[];
}) =>
    ordensUnicas([
        ...(modelo.camposGerais ?? []),
        ...(modelo.agrupamentos ?? []),
    ]);

const ORDEM_DUPLICADA_NO_TOPO =
    "ordem repetida entre campos gerais e agrupamentos.";

/** Na criação, a alternativa ainda não tem `id`: o backend a numera. */
export const alternativaCriacaoSchema = z.strictObject({
    nome: z.string().min(1).max(255),
});

/**
 * Campo exclusivo da ficha, definido dentro da própria posição.
 *
 * O tipo decide o que mais o campo aceita: o numérico exige o modificador e
 * pode ter teto (`valorMaximo`, `decimal(12,4)` — número ou string); só os de
 * alternativa — única e múltipla — têm alternativas; descritivo e observação
 * não têm nada além do básico. `descricao` é obrigatória, mas pode ser vazia.
 */
export const campoFichaCriacaoSchema = z
    .strictObject({
        nome: z.string().min(1).max(255),
        descricao: z.string(),
        tipo: tipoCampoFichaSchema,
        obrigatorio: z.boolean(),
        valorMaximo: z.union([z.number(), z.string()]).nullable().optional(),
        modificadorNota: modificadorNotaSchema.nullable().optional(),
        alternativas: z.array(alternativaCriacaoSchema).optional(),
    })
    .superRefine((campo, ctx) => {
        if (campo.tipo === "NUMERICO") {
            if (!campo.modificadorNota) {
                ctx.addIssue({
                    code: "custom",
                    path: ["modificadorNota"],
                    message: "Campo numérico exige modificador de nota.",
                });
            }
            if (campo.alternativas !== undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["alternativas"],
                    message: "Campo numérico não aceita alternativas.",
                });
            }
            return;
        }

        if (campo.valorMaximo != null || campo.modificadorNota != null) {
            ctx.addIssue({
                code: "custom",
                message: "Este tipo não aceita valor máximo ou modificador.",
            });
        }
        if (
            !aceitaAlternativas(campo.tipo) &&
            campo.alternativas !== undefined
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["alternativas"],
                message: "Este tipo não aceita alternativas.",
            });
        }
    });

/**
 * Uma posição da ficha: ou aponta para um campo que já existe (`campoId`), ou
 * define um novo (`campo`) — nunca os dois. Na criação, ainda sem `id`.
 *
 * O `campoId` precisa ser de um campo global ou exclusivo da ficha de origem;
 * isso só o backend sabe, e recusa com "Campo não pertence à ficha.".
 */
export const posicaoFichaCriacaoSchema = z.union([
    z.strictObject({ ordem: ordemSchema, campoId: idSchema }),
    z.strictObject({ ordem: ordemSchema, campo: campoFichaCriacaoSchema }),
]);

const posicoesCriacaoSchema = z
    .array(posicaoFichaCriacaoSchema)
    .refine(ordensUnicas, ORDEM_DUPLICADA);

/** `quantidade` é quantas vezes o bloco se repete na avaliação. */
export const agrupamentoFichaCriacaoSchema = z.strictObject({
    nome: z.string().min(1).max(255),
    quantidade: z.number().int().min(1),
    ordem: ordemSchema,
    campos: posicoesCriacaoSchema,
});

/**
 * O corpo do `POST`, em dois modos:
 *
 * - **ficha nova** — sem `modeloFichaAvaliativaId`: nasce uma família, na
 *   versão 1;
 * - **a partir de outra** — com `modeloFichaAvaliativaId`: se a origem é da
 *   entidade, vira a próxima versão da mesma família; se é global
 *   (`original`), vira uma família nova da entidade. Omitir `camposGerais` e
 *   `agrupamentos` copia a composição da origem inteira; mandar qualquer um
 *   dos dois a substitui exatamente pelo que foi mandado.
 *
 * Campos gerais e agrupamentos numeram juntos: a `ordem` de cada um é única
 * entre todos eles.
 */
export const criarModeloFichaSchema = z
    .strictObject({
        nome: z.string().min(1).max(255),
        modeloFichaAvaliativaId: idSchema.optional(),
        camposGerais: posicoesCriacaoSchema.optional(),
        agrupamentos: z
            .array(agrupamentoFichaCriacaoSchema)
            .refine(ordensUnicas, ORDEM_DUPLICADA)
            .optional(),
    })
    .refine(ordensDoTopoUnicas, {
        message: ORDEM_DUPLICADA_NO_TOPO,
        path: ["agrupamentos"],
    });

const alternativaFichaSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    ordem: z.number().int(),
});

/**
 * Campo como o backend o devolve. `valorMaximo` e `modificadorNota` só vêm no
 * numérico — o teto como decimal em string (`"0.5000"`) —, e `alternativas`
 * só nos de alternativa, já na `ordem`, e podem vir vazias.
 */
export const campoFichaSchema = z.object({
    id: z.number().int(),
    global: z.boolean(),
    nome: z.string(),
    descricao: z.string(),
    tipo: tipoCampoFichaSchema,
    obrigatorio: z.boolean(),
    valorMaximo: z.string().nullable().optional(),
    modificadorNota: modificadorNotaSchema.nullable().optional(),
    alternativas: z.array(alternativaFichaSchema).optional(),
});

/** O `id` é o da posição, não o do campo: é ele que o `PATCH` referencia. */
export const posicaoFichaSchema = z.object({
    id: z.number().int(),
    ordem: z.number().int(),
    campo: campoFichaSchema,
});

export const agrupamentoFichaSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    quantidade: z.number().int(),
    ordem: z.number().int(),
    campos: z.array(posicaoFichaSchema),
});

/**
 * O detalhe de um modelo, como o `POST` devolve.
 *
 * `codigoFamilia` liga as versões de uma mesma ficha, e `versoes` lista as que
 * não foram excluídas. `original` marca as fichas globais, que a entidade não
 * edita — só copia.
 */
export const modeloFichaDetalheSchema = z.object({
    id: z.number().int(),
    codigoFamilia: z.uuid(),
    versao: z.number().int(),
    nome: z.string(),
    original: z.boolean(),
    editavel: z.boolean(),
    global: z.boolean(),
    camposGerais: z.array(posicaoFichaSchema),
    agrupamentos: z.array(agrupamentoFichaSchema),
    versoes: z.array(
        z.object({ id: z.number().int(), versao: z.number().int() }),
    ),
});

/**
 * O conteúdo de um modelo, para desenhar o cartão da listagem sem buscar o
 * detalhe: os campos vêm só pelo nome. O backend pode mandar as listas
 * inteiras ou cortadas; quando corta, os totais dizem quanto ficou de fora.
 * `totalCampos` conta posições, gerais e de agrupamento, sem multiplicar pela
 * `quantidade`.
 */
export const previaModeloFichaSchema = z.object({
    camposGerais: z.array(z.string()),
    agrupamentos: z.array(
        z.object({
            nome: z.string(),
            quantidade: z.number().int(),
            campos: z.array(z.string()),
        }),
    ),
    totalCampos: z.number().int().optional(),
    totalAgrupamentos: z.number().int().optional(),
});

/** Um item do `GET /fichas-avaliativas/modelos/`. */
export const modeloFichaResumoSchema = modeloFichaDetalheSchema
    .pick({
        id: true,
        codigoFamilia: true,
        versao: true,
        nome: true,
        original: true,
        editavel: true,
        global: true,
    })
    .extend({ previa: previaModeloFichaSchema });

export type TipoCampoFicha = z.infer<typeof tipoCampoFichaSchema>;
export type ModificadorNota = z.infer<typeof modificadorNotaSchema>;
export type CampoFichaCriacao = z.infer<typeof campoFichaCriacaoSchema>;
export type PosicaoFichaCriacao = z.infer<typeof posicaoFichaCriacaoSchema>;
export type AgrupamentoFichaCriacao = z.infer<
    typeof agrupamentoFichaCriacaoSchema
>;
export type CriarModeloFicha = z.infer<typeof criarModeloFichaSchema>;
export type CampoFicha = z.infer<typeof campoFichaSchema>;
export type PosicaoFicha = z.infer<typeof posicaoFichaSchema>;
export type AgrupamentoFicha = z.infer<typeof agrupamentoFichaSchema>;
export type ModeloFichaDetalhe = z.infer<typeof modeloFichaDetalheSchema>;
export type PreviaModeloFicha = z.infer<typeof previaModeloFichaSchema>;
export type ModeloFichaResumo = z.infer<typeof modeloFichaResumoSchema>;
