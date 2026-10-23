/**
 * As recusas do backend chegam soltas em `detail`, na chave do campo ou sem
 * chave nenhuma; sem nenhuma, vale a mensagem genérica de quem chama.
 */
export function mensagemDeErro(
    fieldErrors: Record<string, string[]> | null | undefined,
    padrao: string,
): string {
    const mensagens = Object.values(fieldErrors ?? {}).flat();
    return mensagens.length > 0 ? mensagens.join(" ") : padrao;
}
