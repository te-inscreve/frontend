/**
 * O grupo da entidade: as contas que a tela faz em cima dele.
 *
 * Grupo é um conjunto de integrantes montado só para organização. Ele não
 * pertence a modalidade nenhuma — quem amarra grupo e modalidade é a inscrição,
 * que manda o grupo para o backend saber quem relacionar na ficha.
 *
 * O contrato mora em `@te-inscreve/schemas` (`grupoSchema`,
 * `grupoDetalheSchema`, `formGrupoSchema`); aqui fica só o que é da tela —
 * formatar a data, contar a formação, recalcular o resumo do rascunho.
 */

import { TRPCClientError } from "@trpc/client";

import type { Grupo, Integrante } from "@te-inscreve/schemas";

import { matriculaVencida } from "~/features/entidades/shared/integrantes";

export type { FormGrupo, Grupo, GrupoDetalhe } from "@te-inscreve/schemas";

/** "1 integrante" / "N integrantes" — o plural do número que a tela mostra. */
export function contagemIntegrantes(total: number): string {
    return total === 1 ? "1 integrante" : `${total} integrantes`;
}

/**
 * A data de criação como `dd/mm/aaaa`.
 *
 * `new Date` aqui é seguro, ao contrário do que acontece com as datas secas
 * dos integrantes: este campo chega com hora e fuso, então não há meia-noite
 * UTC para o horário local empurrar para o dia anterior.
 */
export function formatarDataCriacao(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * Recalcula o resumo que o backend deriva da formação.
 *
 * Existe porque a bancada mexe na formação antes de salvar: incluir alguém com
 * a matrícula vencida precisa acender o aviso na hora, e não só depois do
 * `PATCH`. Depois de salvar, o que vale é o detalhe que a API devolve — e ele
 * traz os mesmos dois campos, pela mesma conta.
 */
export function resumirFormacao(
    integrantes: Integrante[],
): Pick<Grupo, "totalIntegrantes" | "pendenciaCarteiraVencida"> {
    return {
        totalIntegrantes: integrantes.length,
        pendenciaCarteiraVencida: integrantes.some((integrante) =>
            matriculaVencida(integrante),
        ),
    };
}

/**
 * Erro de regra que pertence a um campo do formulário, e não à tela inteira.
 *
 * O backend responde assim (`{"nome": ["..."]}` quando o nome repete dentro da
 * entidade), e o formulário de grupo sabe ler esta forma: a mensagem aparece
 * embaixo do campo em vez de virar um aviso genérico acima dos botões.
 */
export class ErroDeCampoGrupo extends Error {
    constructor(
        readonly campo: "nome" | "descricao",
        message: string,
    ) {
        super(message);
        this.name = "ErroDeCampoGrupo";
    }
}

/**
 * Traduz a recusa do backend para o campo do formulário a que ela pertence.
 * Usada tanto para criar (`use-grade-grupos.ts`) quanto para editar
 * (`use-detalhe-grupo.ts`) — as duas mutações passam por `formGrupoSchema`.
 *
 * `{"nome": ["..."]}` chega como `error.data.fieldErrors` (ver o
 * `errorFormatter` de `@te-inscreve/api`). Só `nome` e `descricao` existem no
 * formulário; qualquer outra coisa segue como veio, e o formulário mostra a
 * mensagem genérica.
 *
 * O nome repetido é a exceção: a restrição é de (entidade, nome), e o DRF a
 * devolve sem campo — `non_field_errors`, ou `attr: null` no envelope. É a
 * única regra do grupo que não tem campo, então ela cai no nome, que é onde
 * quem digitou precisa ler a mensagem.
 */
export function relancarPorCampo(error: unknown): never {
    if (error instanceof TRPCClientError) {
        const fieldErrors = (
            error.data as {
                fieldErrors?: Record<string, string[]> | null;
            } | null
        )?.fieldErrors;

        const porCampo = {
            nome: ["nome", "nonFieldErrors", "non_field_errors", ""],
            descricao: ["descricao"],
        } as const;

        for (const [campo, chaves] of Object.entries(porCampo) as [
            keyof typeof porCampo,
            readonly string[],
        ][]) {
            const mensagens = chaves.flatMap(
                (chave) => fieldErrors?.[chave] ?? [],
            );
            if (mensagens.length) {
                throw new ErroDeCampoGrupo(campo, mensagens.join(" "));
            }
        }
    }

    throw error;
}
