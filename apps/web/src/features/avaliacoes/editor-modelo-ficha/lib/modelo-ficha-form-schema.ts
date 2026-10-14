import { z } from "zod/v4";

import type {
    CampoFichaCriacao,
    CriarModeloFicha,
    PosicaoFichaCriacao,
    TipoCampoFicha,
} from "@te-inscreve/schemas";
import {
    criarModeloFichaSchema,
    modificadorNotaSchema,
    tipoCampoFichaSchema,
} from "@te-inscreve/schemas";

/**
 * O formulário do editor de modelo de ficha.
 *
 * Tem a mesma forma do corpo do `POST` — `camposGerais[i].campo.nome` aqui é
 * `camposGerais[i].campo.nome` lá —, com o que só a tela precisa a mais: uma
 * `chave` estável por item, para arrastar e selecionar antes de existir `id`,
 * e o teto do campo numérico como texto, do jeito que é digitado.
 *
 * As regras de domínio — modificador obrigatório no numérico, alternativas só
 * na alternativa múltipla, ordem sem repetição — não são reescritas aqui: o
 * `superRefine` converte os valores no corpo e passa por
 * `criarModeloFichaSchema`, devolvendo as recusas no mesmo caminho.
 */

export const alternativaFormSchema = z.object({
    chave: z.string(),
    nome: z
        .string()
        .trim()
        .min(1, "Informe o texto da alternativa.")
        .max(255, "Use até 255 caracteres."),
});

/** Teto como digitado: vazio, ou número com até quatro casas, `,` ou `.`. */
const VALOR_MAXIMO = /^\d{1,8}([.,]\d{1,4})?$/;

export const campoExclusivoFormSchema = z.object({
    nome: z
        .string()
        .trim()
        .min(1, "Informe o nome do campo.")
        .max(255, "Use até 255 caracteres."),
    descricao: z.string(),
    tipo: tipoCampoFichaSchema,
    obrigatorio: z.boolean(),
    valorMaximo: z
        .string()
        .trim()
        .refine(
            (valor) => valor === "" || VALOR_MAXIMO.test(valor),
            "Informe um número, como 10 ou 0,5.",
        ),
    modificadorNota: modificadorNotaSchema.nullable(),
    alternativas: z.array(alternativaFormSchema),
});

export const posicaoFormSchema = z.discriminatedUnion("origem", [
    z.object({
        chave: z.string(),
        origem: z.literal("global"),
        campoId: z.number().int().min(1),
    }),
    z.object({
        chave: z.string(),
        origem: z.literal("exclusivo"),
        campo: campoExclusivoFormSchema,
    }),
]);

export const agrupamentoFormSchema = z.object({
    chave: z.string(),
    nome: z
        .string()
        .trim()
        .min(1, "Informe o nome do agrupamento.")
        .max(255, "Use até 255 caracteres."),
    quantidade: z
        .number({ error: "Informe quantas vezes os campos se repetem." })
        .int()
        .min(1, "O agrupamento se repete ao menos uma vez."),
    campos: z.array(posicaoFormSchema),
});

/** Alternativa múltipla com menos que isso não dá escolha a quem avalia. */
export const MINIMO_ALTERNATIVAS = 2;

export const modeloFichaFormSchema = z
    .object({
        nome: z
            .string()
            .trim()
            .min(1, "Dê um nome ao modelo.")
            .max(255, "Use até 255 caracteres."),
        camposGerais: z.array(posicaoFormSchema),
        agrupamentos: z.array(agrupamentoFormSchema),
    })
    .superRefine((valores, ctx) => {
        // Regras só da tela: o backend aceita as três, mas nenhuma serve para
        // avaliar alguém.
        const totalPosicoes =
            valores.camposGerais.length +
            valores.agrupamentos.reduce(
                (total, agrupamento) => total + agrupamento.campos.length,
                0,
            );
        if (totalPosicoes === 0) {
            ctx.addIssue({
                code: "custom",
                path: ["camposGerais"],
                message: "Adicione ao menos um campo ao modelo.",
            });
        }

        valores.agrupamentos.forEach((agrupamento, indice) => {
            if (agrupamento.campos.length === 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["agrupamentos", indice, "campos"],
                    message: "Adicione ao menos um campo ao agrupamento.",
                });
            }
        });

        for (const { caminho, campo } of camposExclusivos(valores)) {
            if (
                campo.tipo === "ALTERNATIVA_MULTIPLA" &&
                campo.alternativas.length < MINIMO_ALTERNATIVAS
            ) {
                ctx.addIssue({
                    code: "custom",
                    path: [...caminho, "alternativas"],
                    message: `Cadastre ao menos ${MINIMO_ALTERNATIVAS} alternativas.`,
                });
            }
        }

        // As regras de domínio, pelo schema compartilhado. Só as recusas
        // `custom` passam: as de formato (vazio, tamanho) o schema acima já
        // explica em português, no mesmo caminho.
        const resultado = criarModeloFichaSchema.safeParse(
            paraCriarModeloFicha(valores),
        );
        if (resultado.success) return;

        for (const issue of resultado.error.issues) {
            if (issue.code !== "custom") continue;
            ctx.addIssue({
                code: "custom",
                path: issue.path,
                message: issue.message,
            });
        }
    });

export type AlternativaForm = z.infer<typeof alternativaFormSchema>;
export type CampoExclusivoForm = z.infer<typeof campoExclusivoFormSchema>;
export type PosicaoForm = z.infer<typeof posicaoFormSchema>;
export type PosicaoGlobalForm = Extract<PosicaoForm, { origem: "global" }>;
export type PosicaoExclusivaForm = Extract<
    PosicaoForm,
    { origem: "exclusivo" }
>;
export type AgrupamentoForm = z.infer<typeof agrupamentoFormSchema>;
export type ModeloFichaFormValues = z.infer<typeof modeloFichaFormSchema>;

export const modeloFichaFormDefaults: ModeloFichaFormValues = {
    nome: "",
    camposGerais: [],
    agrupamentos: [],
};

function novaChave() {
    return crypto.randomUUID();
}

export function novaPosicaoGlobal(campoId: number): PosicaoGlobalForm {
    return { chave: novaChave(), origem: "global", campoId };
}

export function novaPosicaoExclusiva(): PosicaoExclusivaForm {
    return {
        chave: novaChave(),
        origem: "exclusivo",
        campo: {
            nome: "Campo sem nome",
            descricao: "",
            tipo: "NUMERICO",
            obrigatorio: true,
            valorMaximo: "",
            modificadorNota: "SOMA",
            alternativas: [],
        },
    };
}

export function novoAgrupamento(): AgrupamentoForm {
    return { chave: novaChave(), nome: "", quantidade: 1, campos: [] };
}

export function novaAlternativa(): AlternativaForm {
    return { chave: novaChave(), nome: "" };
}

/**
 * Ao trocar o tipo, o campo passa a ter só o que o tipo novo aceita: o
 * numérico ganha um modificador, e o que sobrou do tipo anterior sai, para não
 * reaparecer se a pessoa voltar atrás e enviar sem perceber.
 */
export function campoComTipo(
    campo: CampoExclusivoForm,
    tipo: TipoCampoFicha,
): CampoExclusivoForm {
    return {
        ...campo,
        tipo,
        valorMaximo: tipo === "NUMERICO" ? campo.valorMaximo : "",
        modificadorNota:
            tipo === "NUMERICO" ? (campo.modificadorNota ?? "SOMA") : null,
        alternativas: tipo === "ALTERNATIVA_MULTIPLA" ? campo.alternativas : [],
    };
}

/** Caminho de formulário de cada campo exclusivo, na ordem da ficha. */
export function camposExclusivos(valores: ModeloFichaFormValues) {
    const encontrados: {
        chave: string;
        caminho: (string | number)[];
        campo: CampoExclusivoForm;
    }[] = [];

    valores.camposGerais.forEach((posicao, indice) => {
        if (posicao.origem !== "exclusivo") return;
        encontrados.push({
            chave: posicao.chave,
            caminho: ["camposGerais", indice, "campo"],
            campo: posicao.campo,
        });
    });
    valores.agrupamentos.forEach((agrupamento, indiceAgrupamento) => {
        agrupamento.campos.forEach((posicao, indice) => {
            if (posicao.origem !== "exclusivo") return;
            encontrados.push({
                chave: posicao.chave,
                caminho: [
                    "agrupamentos",
                    indiceAgrupamento,
                    "campos",
                    indice,
                    "campo",
                ],
                campo: posicao.campo,
            });
        });
    });

    return encontrados;
}

/**
 * Os valores da tela no corpo do `POST`. A `ordem` é a posição na lista,
 * contada a partir de 1 em cada coleção — campos gerais, agrupamentos e os
 * campos de cada agrupamento numeram à parte, como o backend espera.
 */
export function paraCriarModeloFicha(
    valores: ModeloFichaFormValues,
): CriarModeloFicha {
    return {
        nome: valores.nome.trim(),
        camposGerais: valores.camposGerais.map(paraPosicao),
        agrupamentos: valores.agrupamentos.map((agrupamento, indice) => ({
            nome: agrupamento.nome.trim(),
            quantidade: agrupamento.quantidade,
            ordem: indice + 1,
            campos: agrupamento.campos.map(paraPosicao),
        })),
    };
}

function paraPosicao(
    posicao: PosicaoForm,
    indice: number,
): PosicaoFichaCriacao {
    const ordem = indice + 1;
    if (posicao.origem === "global") {
        return { ordem, campoId: posicao.campoId };
    }
    return { ordem, campo: paraCampo(posicao.campo) };
}

function paraCampo(campo: CampoExclusivoForm): CampoFichaCriacao {
    const base = {
        nome: campo.nome.trim(),
        descricao: campo.descricao.trim(),
        tipo: campo.tipo,
        obrigatorio: campo.obrigatorio,
    };

    if (campo.tipo === "NUMERICO") {
        const teto = campo.valorMaximo.trim().replace(",", ".");
        return {
            ...base,
            valorMaximo: teto === "" ? null : teto,
            modificadorNota: campo.modificadorNota,
        };
    }
    if (campo.tipo === "ALTERNATIVA_MULTIPLA") {
        return {
            ...base,
            alternativas: campo.alternativas.map((alternativa) => ({
                nome: alternativa.nome.trim(),
            })),
        };
    }
    return base;
}
