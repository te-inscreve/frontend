import { randomUUID } from "expo-crypto";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import type { EnvioAvaliacao, ModeloFichaDetalhe } from "@te-inscreve/schemas";
import {
    montarFormularioFicha,
    payloadDoFormulario,
} from "@te-inscreve/schemas";

import type { InscricaoAvaliada } from "./rota-ficha-inscricao";
import type { AvaliacaoLocal } from "~/db/schema";
import { db } from "~/db/cliente";
import { avaliacoes } from "~/db/schema";

/*
 * As avaliações do aparelho (TE-74): o ciclo da avaliação atual e a entrada
 * na fila. O envio, e com ele `enviando`, `com_erro` e `sincronizada`, vem
 * depois; as transições ficam aqui quando ele chegar.
 */

/** De onde a avaliação é: o caminho do POST e o avaliador. */
export interface AlvoDaAvaliacao {
    avaliadorId: string;
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    inscricaoId: number;
}

/** A avaliação local deste avaliador para a inscrição, em qualquer estado. */
export function useAvaliacaoLocal(avaliadorId: string, inscricaoId: number) {
    return useLiveQuery(
        db
            .select()
            .from(avaliacoes)
            .where(
                and(
                    eq(avaliacoes.avaliadorId, avaliadorId),
                    eq(avaliacoes.inscricaoId, inscricaoId),
                ),
            )
            .limit(1),
        [avaliadorId, inscricaoId],
    );
}

/** A avaliação atual do avaliador, se houver uma — de qualquer inscrição. */
export async function avaliacaoAtualDoAvaliador(avaliadorId: string) {
    const [atual] = await consultaAvaliacaoAtual(avaliadorId);
    return atual;
}

/**
 * A avaliação atual do avaliador, ao vivo: a consulta refaz a cada gravação
 * na tabela. É o que a dock do cabeçalho mostra.
 */
export function useAvaliacaoAtual(avaliadorId: string) {
    const { data } = useLiveQuery(consultaAvaliacaoAtual(avaliadorId), [
        avaliadorId,
    ]);
    return data[0];
}

/**
 * As avaliações do avaliador que esperam o servidor ou foram recusadas por
 * ele, ao vivo, na ordem FIFO do envio. `undefined` até a primeira leitura
 * voltar: uma lista vazia antes dela diria "sincronizado" sem saber.
 */
export function useAvaliacoesDaFila(avaliadorId: string) {
    const { data, updatedAt } = useLiveQuery(
        db
            .select()
            .from(avaliacoes)
            .where(
                and(
                    eq(avaliacoes.avaliadorId, avaliadorId),
                    inArray(avaliacoes.estado, [
                        "na_fila",
                        "enviando",
                        "com_erro",
                    ]),
                ),
            )
            .orderBy(asc(avaliacoes.enfileiradoEm)),
        [avaliadorId],
    );
    return updatedAt === undefined ? undefined : data;
}

function consultaAvaliacaoAtual(avaliadorId: string) {
    return db
        .select()
        .from(avaliacoes)
        .where(
            and(
                eq(avaliacoes.avaliadorId, avaliadorId),
                eq(avaliacoes.estado, "atual"),
            ),
        )
        .limit(1);
}

/**
 * Começa a avaliação atual de uma inscrição, com a ficha em branco e a
 * própria cópia do modelo. Quem chama já conferiu que o avaliador não tem
 * outra avaliação atual: o índice único recusa uma segunda.
 */
export async function comecarAvaliacaoAtual(
    alvo: AlvoDaAvaliacao,
    modelo: ModeloFichaDetalhe,
    inscricao: InscricaoAvaliada,
) {
    const agora = new Date();
    await db.insert(avaliacoes).values({
        id: randomUUID(),
        ...alvo,
        estado: "atual",
        payload: payloadDoFormulario(
            modelo,
            montarFormularioFicha(modelo).defaultValues,
        ),
        modelo,
        inscricao,
        criadoEm: agora,
        atualizadoEm: agora,
    });
}

/**
 * Guarda o que o avaliador preencheu. Avaliação atual congelada não muda
 * mais.
 */
export async function guardarAvaliacaoAtual(
    id: string,
    payload: EnvioAvaliacao,
) {
    await db
        .update(avaliacoes)
        .set({ payload, atualizadoEm: new Date() })
        .where(
            and(
                eq(avaliacoes.id, id),
                eq(avaliacoes.estado, "atual"),
                isNull(avaliacoes.motivoCongelado),
            ),
        );
}

/**
 * Congela a avaliação atual: a versão do modelo mudou, ou a categoria
 * encerrou. Só leitura daí em diante; a única saída é descartar.
 */
export async function congelarAvaliacaoAtual(id: string, motivo: string) {
    await db
        .update(avaliacoes)
        .set({ motivoCongelado: motivo, atualizadoEm: new Date() })
        .where(and(eq(avaliacoes.id, id), eq(avaliacoes.estado, "atual")));
}

/**
 * O "Salvar" do formulário: a avaliação atual vai para o fim da fila, com o
 * payload final.
 */
export async function enfileirar(id: string, payload: EnvioAvaliacao) {
    const agora = new Date();
    await db
        .update(avaliacoes)
        .set({
            estado: "na_fila",
            payload,
            enfileiradoEm: agora,
            atualizadoEm: agora,
            tentativas: 0,
            proximaTentativaEm: null,
            erro: null,
        })
        .where(and(eq(avaliacoes.id, id), eq(avaliacoes.estado, "atual")));
}

/**
 * Apaga a avaliação local. O que o servidor já aceitou não se descarta, nem
 * o que está sendo enviado.
 */
export async function descartar(id: string) {
    await db
        .delete(avaliacoes)
        .where(
            and(
                eq(avaliacoes.id, id),
                inArray(avaliacoes.estado, ["atual", "na_fila", "com_erro"]),
            ),
        );
}

/**
 * Ao abrir: o envio que estava em curso quando o app morreu volta para a
 * fila, no mesmo lugar. Se ele chegou ao servidor, o reenvio dá 409 e a
 * conferência o marca como sincronizado (TE-68).
 */
export async function retomarEnviosInterrompidos() {
    await db
        .update(avaliacoes)
        .set({ estado: "na_fila" })
        .where(eq(avaliacoes.estado, "enviando"));
}

export type { AvaliacaoLocal };
