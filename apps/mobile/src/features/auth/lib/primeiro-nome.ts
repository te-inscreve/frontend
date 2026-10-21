/** A primeira palavra do nome do usuário, para a saudação. */
export function primeiroNome(nome: string): string {
    return nome.trim().split(/\s+/)[0] ?? "";
}
