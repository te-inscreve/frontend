import type {
    InscricoesDaCategoria,
    ModeloFichaDetalhe,
} from "@te-inscreve/schemas";

import type { CategoriaPronta } from "./listar-categorias-prontas";
import type { AvaliacaoLocal } from "~/db/schema";

/*
 * O download offline (TE-107): a lista de categorias prontas e, de cada uma,
 * as inscrições e o modelo de ficha, para o avaliador começar uma avaliação
 * sem rede. Nada aqui toca o banco ou a rede direto — vem tudo pelas portas,
 * e quem as liga ao SQLite e ao tRPC é `download-local.ts`.
 */

/** O que o aparelho guarda de uma categoria. */
export interface DownloadCategoria {
    categoriaId: number;
    inscricoes: InscricoesDaCategoria;
    /** `null`: a categoria não tem modelo vinculado. */
    modelo: ModeloFichaDetalhe | null;
}

/**
 * O que gravar, numa transação só: a lista substitui a anterior inteira; os
 * downloads novos substituem os de mesma categoria; e sai o download de toda
 * categoria fora da lista. A categoria cujo download falhou fica com o
 * anterior, se havia.
 */
export interface PlanoDownload {
    categorias: CategoriaPronta[];
    downloads: DownloadCategoria[];
}

export interface PortasDownload {
    listar: () => Promise<CategoriaPronta[]>;
    baixar: (
        categoria: CategoriaPronta,
    ) => Promise<Omit<DownloadCategoria, "categoriaId">>;
    gravar: (plano: PlanoDownload) => Promise<void>;
    /** As avaliações atuais não congeladas, de qualquer avaliador. */
    avaliacoesAtuais: () => Promise<AvaliacaoLocal[]>;
    congelar: (id: string, motivo: string) => Promise<void>;
}

export type ResultadoDownload =
    | { ok: true; falharam: number[] }
    /** A lista não veio: nada mudou no aparelho. */
    | { ok: false };

/** Baixa a lista e todas as categorias dela, e grava de uma vez. */
export async function baixarCategorias(
    portas: PortasDownload,
): Promise<ResultadoDownload> {
    let categorias: CategoriaPronta[];
    try {
        categorias = await portas.listar();
    } catch {
        return { ok: false };
    }
    const downloads: DownloadCategoria[] = [];
    const falharam: number[] = [];
    // Algumas por vez: o link do tRPC junta as chamadas simultâneas num
    // lote, e um evento grande não dispara centenas de requisições juntas.
    for (let inicio = 0; inicio < categorias.length; inicio += SIMULTANEAS) {
        const lote = categorias.slice(inicio, inicio + SIMULTANEAS);
        const resultados = await Promise.allSettled(
            lote.map((categoria) => portas.baixar(categoria)),
        );
        lote.forEach(({ id }, indice) => {
            const resultado = resultados[indice];
            if (resultado?.status === "fulfilled")
                downloads.push({ categoriaId: id, ...resultado.value });
            else falharam.push(id);
        });
    }
    await portas.gravar({ categorias, downloads });

    for (const avaliacao of await portas.avaliacoesAtuais()) {
        const motivo = motivoParaCongelar(avaliacao, categorias, downloads);
        if (motivo) await portas.congelar(avaliacao.id, motivo);
    }

    return { ok: true, falharam };
}

/**
 * Por que a avaliação atual não pode continuar, pelo que acabou de chegar
 * (spec, "Modelo mudou na API" e "Categoria encerrada no refresh"). Sem o
 * download da categoria, nada se sabe dela e nada muda.
 */
function motivoParaCongelar(
    avaliacao: AvaliacaoLocal,
    categorias: CategoriaPronta[],
    downloads: DownloadCategoria[],
) {
    if (!categorias.some(({ id }) => id === avaliacao.categoriaId))
        return "Esta categoria não está mais aberta para avaliação.";
    const baixado = downloads.find(
        ({ categoriaId }) => categoriaId === avaliacao.categoriaId,
    );
    if (!baixado) return undefined;
    if (!baixado.modelo) return "Esta categoria ficou sem modelo de ficha.";
    if (baixado.modelo.id !== avaliacao.modelo.id)
        return "O modelo de ficha desta categoria mudou depois que esta avaliação começou.";
    return undefined;
}

/** Quantas categorias baixam ao mesmo tempo. */
const SIMULTANEAS = 4;
