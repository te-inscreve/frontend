import { z } from "zod/v4";

/**
 * Campos numéricos como a UI os produz.
 *
 * Um `<input type="number">` só devolve string: o campo vazio vira `null`
 * quando o valor é opcional e `NaN` quando é obrigatório — e o Zod recusa o
 * `NaN` com a mesma mensagem de um número inválido, que é o que o organizador
 * precisa ler.
 */

export const inteiroNaoNegativo = (mensagem: string) =>
    z.number({ error: mensagem }).int(mensagem).min(0, mensagem);

export const inteiroPositivoOpcional = (mensagem: string) =>
    z.number({ error: mensagem }).int(mensagem).positive(mensagem).nullable();
