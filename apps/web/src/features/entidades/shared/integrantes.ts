/**
 * O integrante da entidade, como a API o devolve, e as contas que as telas
 * fazem em cima dele.
 *
 * O contrato mora em `@te-inscreve/schemas` (`integranteSchema`); aqui fica
 * só o que é da tela — formatar data, medir idade, dizer se a matrícula
 * venceu. Três lugares dependem disto por motivos diferentes: o painel
 * resume, a tela de integrantes cadastra, e os grupos apenas referenciam ids.
 */

import type { Integrante } from "@te-inscreve/schemas";

export type { Integrante } from "@te-inscreve/schemas";

/** Nome e sobrenome juntos — a API guarda os dois separados. */
export function nomeCompleto(
    integrante: Pick<Integrante, "nome" | "sobrenome">,
) {
    return `${integrante.nome} ${integrante.sobrenome}`.trim();
}

/**
 * O caminho de volta de {@link nomeCompleto}: a primeira palavra é o nome, o
 * resto é o sobrenome.
 *
 * "Maria da Silva Souza" vira "Maria" e "da Silva Souza". Não é a regra que
 * acerta todo mundo — quem tem nome composto na frente, como "Ana Paula",
 * perde a segunda metade para o sobrenome —, mas é a que erra menos numa
 * caixa só: a API guarda os dois campos separados, e quem cadastra lê o nome
 * inteiro da carteirinha de uma vez.
 *
 * Espaço repetido no meio some junto, senão o sobrenome sairia com buraco.
 */
export function dividirNome(completo: string) {
    const [nome = "", ...resto] = completo.trim().split(/\s+/);
    return { nome, sobrenome: resto.join(" ") };
}

/** Lê uma data ISO (`aaaa-mm-dd`) como data local, sem o fuso do `new Date`. */
export function dataDeISO(iso: string): Date {
    const [ano = 0, mes = 1, dia = 1] = iso.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

/** Formata uma data ISO como `dd/mm/aaaa`; sem data, diz que não há. */
export function formatarDataISO(iso: string | null): string {
    if (!iso) return "Não informada";
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
}

/** ISO local (`aaaa-mm-dd`) — `toISOString` deslocaria a data pelo fuso. */
export function paraISO(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Idade em anos completos na data de referência (hoje, por padrão). */
export function idadeEm(dataNascimento: string, referencia = new Date()) {
    const nascimento = dataDeISO(dataNascimento);
    let idade = referencia.getFullYear() - nascimento.getFullYear();

    const aniversarioAindaNaoVeio =
        referencia.getMonth() < nascimento.getMonth() ||
        (referencia.getMonth() === nascimento.getMonth() &&
            referencia.getDate() < nascimento.getDate());

    if (aniversarioAindaNaoVeio) idade -= 1;

    return idade;
}

/**
 * Matrícula vencida trava a inscrição no evento, então a tela precisa avisar.
 *
 * Sem validade cadastrada não há o que vencer: a pessoa aparece como ativa,
 * e o detalhe mostra a data como não informada.
 */
export function matriculaVencida(
    integrante: Pick<Integrante, "validade">,
    referencia = new Date(),
) {
    if (!integrante.validade) return false;
    return dataDeISO(integrante.validade) < referencia;
}
