import { and, eq, isNull, notInArray } from "drizzle-orm";

import type { PlanoDownload, PortasDownload } from "./download";
import { db } from "~/db/cliente";
import { avaliacoes, categoriasProntas, downloadsCategoria } from "~/db/schema";
import { congelarAvaliacaoAtual } from "~/features/avaliacoes/lib/avaliacoes-locais";
import { trpcClient } from "~/utils/api";
import { comTempoMaximo as comTempo } from "~/utils/rede";
import { listarCategoriasProntas } from "./listar-categorias-prontas";

/*
 * As portas do download offline ligadas ao SQLite e ao tRPC (TE-107). As
 * telas leem o banco por `use-categorias-baixadas.ts`; a rede só o alimenta.
 */

/** Sem resposta nesse tempo, o download daquela categoria falha. */
const TEMPO_MAXIMO_MS = 30_000;

export const portasDoDownload: PortasDownload = {
    listar: () => comTempoMaximo(() => listarCategoriasProntas()),
    baixar: (categoria) =>
        comTempoMaximo(async (signal) => {
            const caminho = {
                eventoId: categoria.eventoId,
                modalidadeId: categoria.modalidadeId,
                categoriaId: categoria.id,
            };
            const [inscricoes, modelo] = await Promise.all([
                trpcClient.inscricao.getAll.query(caminho, { signal }),
                trpcClient.categoria.getFichaAvaliativa.query(caminho, {
                    signal,
                }),
            ]);
            return { inscricoes, modelo };
        }),
    gravar: (plano) => Promise.resolve(gravarDownload(plano)),
    avaliacoesAtuais: () =>
        db
            .select()
            .from(avaliacoes)
            .where(
                and(
                    eq(avaliacoes.estado, "atual"),
                    isNull(avaliacoes.motivoCongelado),
                ),
            ),
    congelar: congelarAvaliacaoAtual,
};

/**
 * Grava o plano numa transação exclusiva: quem lê vê o download anterior
 * inteiro ou o novo inteiro, nunca a mistura.
 *
 * Síncrona de propósito: no expo-sqlite o `transaction` do Drizzle é
 * síncrono, e com um callback `async` o `commit` sairia no primeiro `await`,
 * deixando o resto fora da transação.
 */
function gravarDownload({ categorias, downloads }: PlanoDownload) {
    const agora = new Date();
    db.transaction(
        (tx) => {
            tx.delete(categoriasProntas).run();
            if (categorias.length > 0)
                tx.insert(categoriasProntas)
                    .values(
                        categorias.map((categoria, posicao) => ({
                            id: categoria.id,
                            posicao,
                            categoria,
                            baixadaEm: agora,
                        })),
                    )
                    .run();

            for (const download of downloads) {
                const linha = { ...download, baixadoEm: agora };
                tx.insert(downloadsCategoria)
                    .values(linha)
                    .onConflictDoUpdate({
                        target: downloadsCategoria.categoriaId,
                        set: linha,
                    })
                    .run();
            }

            // A categoria fora da lista leva o download junto; a que só
            // falhou agora continua na lista e fica com o anterior.
            const ids = categorias.map(({ id }) => id);
            tx.delete(downloadsCategoria)
                .where(
                    ids.length > 0
                        ? notInArray(downloadsCategoria.categoriaId, ids)
                        : undefined,
                )
                .run();
        },
        { behavior: "exclusive" },
    );
}

/** Cancela a chamada que passa de {@link TEMPO_MAXIMO_MS}. */
function comTempoMaximo<T>(chamada: (signal: AbortSignal) => Promise<T>) {
    return comTempo(TEMPO_MAXIMO_MS, chamada);
}
