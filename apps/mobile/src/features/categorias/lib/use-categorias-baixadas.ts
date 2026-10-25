import { asc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import type { DownloadCategoria } from "./download";
import type { CategoriaPronta } from "./listar-categorias-prontas";
import { db } from "~/db/cliente";
import { categoriasProntas, downloadsCategoria } from "~/db/schema";
import { useEstadoDownload } from "./use-download";

/*
 * O que o aparelho baixou (TE-107), como as telas o leem: ao vivo, do
 * SQLite, sem rede.
 */

/** Uma categoria da lista e se ela já pode ser avaliada sem rede. */
export interface CategoriaBaixada {
    categoria: CategoriaPronta;
    disponivelOffline: boolean;
}

/**
 * As categorias baixadas, ao vivo, na ordem da API. `undefined` até a
 * primeira leitura voltar.
 *
 * Duas consultas, e não um join: o `useLiveQuery` só refaz a consulta quando
 * muda a tabela principal dela.
 */
export function useCategoriasBaixadas(): CategoriaBaixada[] | undefined {
    const lista = useLiveQuery(
        db
            .select()
            .from(categoriasProntas)
            .orderBy(asc(categoriasProntas.posicao)),
    );
    const baixadas = useLiveQuery(
        db
            .select({ categoriaId: downloadsCategoria.categoriaId })
            .from(downloadsCategoria),
    );
    if (lista.updatedAt === undefined || baixadas.updatedAt === undefined)
        return undefined;

    const comDownload = new Set(
        baixadas.data.map(({ categoriaId }) => categoriaId),
    );
    return lista.data.map(({ categoria }) => ({
        categoria,
        disponivelOffline: comDownload.has(categoria.id),
    }));
}

/**
 * O download de uma categoria, ao vivo: `null` se ela não foi baixada,
 * `undefined` até a primeira leitura voltar.
 */
export function useDownloadDaCategoria(
    categoriaId: number,
): DownloadCategoria | null | undefined {
    const { data, updatedAt } = useLiveQuery(
        db
            .select()
            .from(downloadsCategoria)
            .where(eq(downloadsCategoria.categoriaId, categoriaId))
            .limit(1),
        [categoriaId],
    );
    if (updatedAt === undefined) return undefined;
    const [linha] = data;
    return linha
        ? {
              categoriaId: linha.categoriaId,
              inscricoes: linha.inscricoes,
              modelo: linha.modelo ?? null,
          }
        : null;
}

/** A categoria baixada com esse id, se ela está na lista. */
export async function categoriaBaixada(id: number) {
    const [linha] = await db
        .select()
        .from(categoriasProntas)
        .where(eq(categoriasProntas.id, id))
        .limit(1);
    return linha?.categoria;
}

/**
 * Onde a categoria está para a tela que precisa das inscrições ou do modelo:
 * lendo o banco (ou o primeiro download a caminho), sem download, ou baixada.
 * `falhou` diz se a última tentativa de baixá-la falhou com rede.
 */
export type SituacaoDaCategoria =
    | { tipo: "carregando" }
    | { tipo: "nao-baixada"; falhou: boolean }
    | { tipo: "baixada"; download: DownloadCategoria };

export function useSituacaoDaCategoria(
    categoriaId: number,
): SituacaoDaCategoria {
    const baixado = useDownloadDaCategoria(categoriaId);
    const download = useEstadoDownload();
    if (baixado) return { tipo: "baixada", download: baixado };
    if (baixado === undefined || download.baixando)
        return { tipo: "carregando" };
    return {
        tipo: "nao-baixada",
        falhou: download.falharam.includes(categoriaId),
    };
}
