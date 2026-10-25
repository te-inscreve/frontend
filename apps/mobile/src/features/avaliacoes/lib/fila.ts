import { formularioDoPayload } from "@te-inscreve/schemas";

import type { EstadoFila } from "./estado-fila";
import type { EstadoMotor } from "./motor-fila";
import type { AvaliacaoLocal } from "~/db/schema";
import { notaDaFicha, trechosDaFicha } from "./formulario-ficha";
import { formatarNota } from "./minhas-avaliacoes";

/** Uma avaliação na fila: salva pelo avaliador, aguardando envio. */
export interface AvaliacaoNaFila {
    id: string;
    /** O nome do concorrente da inscrição avaliada. */
    concorrente: string;
    /** "Entidade · Categoria · Modalidade". */
    origem: string;
    /** A prévia de `calcularNota`, já formatada (`"8,75"`). */
    nota: string;
    /** O rodapé do card: quando foi salva, a espera, ou o envio. */
    situacao: SituacaoNaFila;
}

/** Onde a avaliação está na fila, para o rodapé do card. */
export type SituacaoNaFila =
    | { tipo: "salva"; em: Date }
    | { tipo: "enviando" }
    | { tipo: "espera_conexao" }
    | { tipo: "nova_tentativa"; tentativa: number; em: Date };

/** Uma avaliação com erro: o backend a recusou de vez. */
export interface AvaliacaoComErro extends Omit<AvaliacaoNaFila, "situacao"> {
    /** Por que o backend recusou, no texto que o avaliador lê. */
    motivo: string;
}

/**
 * A fila de envio inteira: o estado que a dock resume e as avaliações que o
 * detalhe da fila lista.
 */
export interface Fila {
    estado: EstadoFila;
    naFila: AvaliacaoNaFila[];
    comErro: AvaliacaoComErro[];
}

/**
 * A fila a partir das linhas do banco em `na_fila`, `enviando` e `com_erro`,
 * já na ordem de envio, e do que o motor está fazendo. O estado segue a
 * gravidade: um erro pede ação do avaliador e vence o resto; depois, o envio
 * em curso; depois, a pausa; depois, a espera.
 */
export function filaDasAvaliacoes(
    linhas: AvaliacaoLocal[],
    motor?: EstadoMotor,
): Fila {
    const semRede = !!motor?.semRede;
    const naFila = linhas
        .filter((linha) => linha.estado !== "com_erro")
        .map((linha) => ({
            ...itemDaFila(linha),
            situacao: situacaoDa(linha, semRede),
        }));
    const comErro = linhas
        .filter((linha) => linha.estado === "com_erro")
        .map((linha) => ({
            ...itemDaFila(linha),
            motivo: linha.erro?.mensagem ?? "O servidor recusou a avaliação.",
        }));
    const enviando =
        (motor !== undefined && motor.fase !== "parado") ||
        linhas.some((linha) => linha.estado === "enviando");

    let estado: EstadoFila;
    if (comErro.length > 0)
        estado = { tipo: "com_erro", comErro: comErro.length };
    else if (enviando && naFila.length > 0)
        estado = {
            tipo: "sincronizando",
            enviadas: motor?.enviadas ?? 0,
            // As aceitas já saíram da lista; o total é o do começo da rodada.
            total: Math.max(motor?.total ?? 0, naFila.length),
        };
    else if (naFila.length > 0 && motor?.pedeLogin)
        estado = { tipo: "pausado", naFila: naFila.length, motivo: "login" };
    else if (naFila.length > 0 && semRede)
        estado = { tipo: "pausado", naFila: naFila.length, motivo: "conexao" };
    else if (naFila.length > 0)
        estado = { tipo: "aguardando", naFila: naFila.length };
    else estado = { tipo: "sincronizado" };

    return { estado, naFila, comErro };
}

function situacaoDa(linha: AvaliacaoLocal, semRede: boolean): SituacaoNaFila {
    if (linha.estado === "enviando") return { tipo: "enviando" };
    if (semRede) return { tipo: "espera_conexao" };
    if (linha.tentativas > 0 && linha.proximaTentativaEm)
        return {
            tipo: "nova_tentativa",
            tentativa: linha.tentativas,
            em: linha.proximaTentativaEm,
        };
    return { tipo: "salva", em: linha.enfileiradoEm ?? linha.atualizadoEm };
}

function itemDaFila(linha: AvaliacaoLocal) {
    const { inscricao } = linha;
    return {
        id: linha.id,
        concorrente: inscricao.concorrente,
        origem: [inscricao.entidade, inscricao.categoria, inscricao.modalidade]
            .filter(Boolean)
            .join(" · "),
        nota: notaPrevia(linha),
    };
}

/**
 * A nota de uma avaliação que ainda não chegou ao servidor, já formatada
 * (`"8,75"`): a prévia de `calcularNota`. Vale a que o servidor gravar.
 */
export function notaPrevia(linha: AvaliacaoLocal) {
    return formatarNota(
        String(
            notaDaFicha(
                trechosDaFicha(linha.modelo),
                formularioDoPayload(linha.modelo, linha.payload),
            ),
        ),
    );
}
