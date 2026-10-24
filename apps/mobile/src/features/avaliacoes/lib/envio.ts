import { TRPCClientError } from "@trpc/client";

import type { AppRouter } from "@te-inscreve/api";

import type {
    AvaliacaoNoServidor,
    Consulta,
    PortasFila,
    Resposta,
} from "./motor-fila";
import type { AvaliacaoLocal } from "~/db/schema";
import { queryClient, trpc, trpcClient } from "~/utils/api";
import {
    avaliacoesNaFila,
    devolverAFila,
    marcarComErro,
    marcarEnviando,
    marcarSincronizada,
    retomarEnviosInterrompidos,
} from "./avaliacoes-locais";

/*
 * As portas do motor da fila ligadas ao SQLite e ao tRPC do Next. O envio é
 * só isto: trocar `enviar` pelo nativo é o que o segundo plano (TE-105)
 * mudaria.
 */

/** Sem resposta nesse tempo, a tentativa conta como falha temporária. */
const TEMPO_MAXIMO_MS = 30_000;

/** As portas do motor para o avaliador logado. */
export function portasDoAvaliador(avaliadorId: string): PortasFila {
    return {
        avaliadorId: Number(avaliadorId),
        retomarInterrompidas: retomarEnviosInterrompidos,
        naFila: () => avaliacoesNaFila(avaliadorId),
        marcarEnviando,
        async marcarSincronizada(id, servidor) {
            await marcarSincronizada(id, servidor);
            // A lista de avaliações passa a mostrá-la pelo servidor.
            void queryClient.invalidateQueries(
                trpc.avaliacao.getMinhasAvaliacoes.queryFilter(),
            );
        },
        marcarComErro,
        devolverAFila,
        enviar,
        minhasAvaliacoes,
        avaliacoesDaInscricao,
    };
}

/** O `POST` da avaliação, pela mutation `avaliacao.enviar`. */
export async function enviar(avaliacao: AvaliacaoLocal): Promise<Resposta> {
    try {
        const corpo = await comTempoMaximo((signal) =>
            trpcClient.avaliacao.enviar.mutate(
                {
                    ...caminhoDa(avaliacao),
                    avaliacao: avaliacao.payload,
                },
                { signal },
            ),
        );
        return { status: 201, corpo };
    } catch (erro) {
        return respostaDoErro(erro);
    }
}

async function minhasAvaliacoes(): Promise<Consulta<AvaliacaoNoServidor[]>> {
    try {
        const eventos = await comTempoMaximo((signal) =>
            trpcClient.avaliacao.getMinhasAvaliacoes.query(undefined, {
                signal,
            }),
        );
        return {
            ok: true,
            dados: eventos.flatMap((evento) =>
                evento.modalidades.flatMap((modalidade) =>
                    modalidade.categorias.flatMap(
                        (categoria) => categoria.avaliacoes,
                    ),
                ),
            ),
        };
    } catch (erro) {
        return { ok: false, resposta: respostaDoErro(erro) };
    }
}

async function avaliacoesDaInscricao(
    avaliacao: AvaliacaoLocal,
): Promise<Consulta<AvaliacaoNoServidor[]>> {
    try {
        const lista = await comTempoMaximo((signal) =>
            trpcClient.avaliacao.getDaInscricao.query(caminhoDa(avaliacao), {
                signal,
            }),
        );
        return {
            ok: true,
            dados: lista.map((item) => ({
                ...item,
                inscricaoId: avaliacao.inscricaoId,
            })),
        };
    } catch (erro) {
        return { ok: false, resposta: respostaDoErro(erro) };
    }
}

function caminhoDa(avaliacao: AvaliacaoLocal) {
    return {
        eventoId: avaliacao.eventoId,
        modalidadeId: avaliacao.modalidadeId,
        categoriaId: avaliacao.categoriaId,
        inscricaoId: avaliacao.inscricaoId,
    };
}

/**
 * O erro do tRPC como a resposta do Django: o `upstreamStatus` que o
 * servidor repassa (TE-83), ou o status do próprio Next quando a recusa é
 * dele (sessão ausente, payload que não passa no schema). Sem `data`, a
 * resposta nem chegou: rede, timeout ou Next fora do ar.
 */
function respostaDoErro(erro: unknown): Resposta {
    if (!(erro instanceof TRPCClientError)) return { status: null };
    const { data } = erro as TRPCClientError<AppRouter>;
    if (!data) return { status: null };
    if (data.upstreamStatus !== undefined)
        return {
            status: data.upstreamStatus,
            corpo: data.upstreamBody,
            retryAfter: data.retryAfter,
        };
    // A recusa é do Next, não do Django. Só a sessão ausente e o payload que
    // não passa no schema dizem algo da avaliação; o resto — procedure que o
    // servidor ainda não tem, falha interna — é do servidor, e a fila repete.
    return {
        status: STATUS_DO_PROPRIO_NEXT.has(data.httpStatus)
            ? data.httpStatus
            : null,
    };
}

const STATUS_DO_PROPRIO_NEXT = new Set([400, 401, 403]);

/** Cancela a chamada que passa de {@link TEMPO_MAXIMO_MS}. */
async function comTempoMaximo<T>(chamada: (signal: AbortSignal) => Promise<T>) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_MAXIMO_MS);
    try {
        return await chamada(controle.signal);
    } finally {
        clearTimeout(relogio);
    }
}
