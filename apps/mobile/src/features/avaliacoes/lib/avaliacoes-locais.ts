import { randomUUID } from "expo-crypto";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import type { EnvioAvaliacao, ModeloFichaDetalhe } from "@te-inscreve/schemas";
import {
    montarFormularioFicha,
    payloadDoFormulario,
} from "@te-inscreve/schemas";

import type { InscricaoAvaliada } from "./rota-ficha-inscricao";
import type { AvaliacaoLocal, ErroDeEnvio } from "~/db/schema";
import { db } from "~/db/cliente";
import { avaliacoes } from "~/db/schema";

/*
 * As avaliações do aparelho (TE-74): o ciclo da avaliação atual, a entrada
 * na fila e as transições do envio (TE-106). Cada transição é condicional ao
 * estado de origem: o motor e o avaliador nunca disputam a mesma linha.
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

/**
 * As avaliações salvas do avaliador — tudo menos a atual —, ao vivo, na ordem
 * em que entraram na fila. É o que a lista de avaliações cruza com o
 * servidor. `undefined` até a primeira leitura voltar.
 */
export function useAvaliacoesSalvas(avaliadorId: string) {
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
                        "sincronizada",
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
 * Ao abrir e ao voltar para a frente: o envio que estava em curso quando o
 * app morreu volta para a fila, no mesmo lugar. Se ele chegou ao servidor, a
 * conferência o acha antes do reenvio; e o reenvio que ainda der 409 cai na
 * consulta do TE-68.
 */
export async function retomarEnviosInterrompidos() {
    await db
        .update(avaliacoes)
        .set({ estado: "na_fila" })
        .where(eq(avaliacoes.estado, "enviando"));
}

/** As avaliações do avaliador esperando envio, na ordem FIFO. */
export function avaliacoesNaFila(avaliadorId: string) {
    return db
        .select()
        .from(avaliacoes)
        .where(
            and(
                eq(avaliacoes.avaliadorId, avaliadorId),
                eq(avaliacoes.estado, "na_fila"),
            ),
        )
        .orderBy(asc(avaliacoes.enfileiradoEm));
}

/** `na_fila` → `enviando`. `false` se ela já tinha saído da fila. */
export async function marcarEnviando(id: string) {
    const alteradas = await db
        .update(avaliacoes)
        .set({ estado: "enviando", atualizadoEm: new Date() })
        .where(and(eq(avaliacoes.id, id), eq(avaliacoes.estado, "na_fila")))
        .returning({ id: avaliacoes.id });
    return alteradas.length > 0;
}

/** O servidor tem a avaliação: ela não muda mais. */
export async function marcarSincronizada(
    id: string,
    servidor: { servidorId: number; nota: string },
) {
    const agora = new Date();
    await db
        .update(avaliacoes)
        .set({
            estado: "sincronizada",
            servidorId: servidor.servidorId,
            nota: servidor.nota,
            enviadoEm: agora,
            atualizadoEm: agora,
            proximaTentativaEm: null,
            erro: null,
        })
        .where(
            and(
                eq(avaliacoes.id, id),
                inArray(avaliacoes.estado, ["na_fila", "enviando"]),
            ),
        );
}

/** O servidor recusou de vez: sai da fila e espera o avaliador. */
export async function marcarComErro(id: string, erro: ErroDeEnvio) {
    await db
        .update(avaliacoes)
        .set({
            estado: "com_erro",
            erro,
            atualizadoEm: new Date(),
            proximaTentativaEm: null,
        })
        .where(and(eq(avaliacoes.id, id), eq(avaliacoes.estado, "enviando")));
}

/**
 * `enviando` → `na_fila`, no mesmo lugar (`enfileiradoEm` não muda). Com
 * `falha`, conta a tentativa e marca até quando esperar.
 */
export async function devolverAFila(
    id: string,
    falha?: { tentativas: number; proximaTentativaEm: Date },
) {
    await db
        .update(avaliacoes)
        .set({ estado: "na_fila", atualizadoEm: new Date(), ...falha })
        .where(and(eq(avaliacoes.id, id), eq(avaliacoes.estado, "enviando")));
}

/** Por que uma avaliação não saiu da fila para editar. */
export type RecusaEdicao = "enviando" | "outra_atual" | "nao_esta_na_fila";

/**
 * O "Editar": a avaliação na fila volta a ser a avaliação atual, e só volta
 * à fila — no fim — ao ser salva de novo. Numa transação que só a aceita em
 * `na_fila`: com um remetente só, o motor e o avaliador não mexem nela ao
 * mesmo tempo. Quais avaliações com erro se corrigem fica para o ticket
 * delas: a de 409 e a de modelo mudado só se descartam.
 */
export async function tirarDaFila(
    id: string,
): Promise<{ ok: true } | { ok: false; motivo: RecusaEdicao }> {
    return db.transaction(async (tx) => {
        const [linha] = await tx
            .select({
                estado: avaliacoes.estado,
                avaliadorId: avaliacoes.avaliadorId,
            })
            .from(avaliacoes)
            .where(eq(avaliacoes.id, id));
        if (linha?.estado === "enviando")
            return { ok: false, motivo: "enviando" } as const;
        if (linha?.estado !== "na_fila")
            return { ok: false, motivo: "nao_esta_na_fila" } as const;

        const [outra] = await tx
            .select({ id: avaliacoes.id })
            .from(avaliacoes)
            .where(
                and(
                    eq(avaliacoes.avaliadorId, linha.avaliadorId),
                    eq(avaliacoes.estado, "atual"),
                ),
            )
            .limit(1);
        if (outra) return { ok: false, motivo: "outra_atual" } as const;

        await tx
            .update(avaliacoes)
            .set({
                estado: "atual",
                enfileiradoEm: null,
                tentativas: 0,
                proximaTentativaEm: null,
                erro: null,
                atualizadoEm: new Date(),
            })
            .where(
                and(eq(avaliacoes.id, id), eq(avaliacoes.estado, "na_fila")),
            );
        return { ok: true } as const;
    });
}

export type { AvaliacaoLocal };
