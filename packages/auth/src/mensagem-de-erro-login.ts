const MENSAGEM_GENERICA =
    "Não foi possível entrar. Tente novamente mais tarde.";

/**
 * A chamada de auth nem chegou a ter resposta: sem rede, servidor fora do ar,
 * timeout.
 *
 * O better-fetch devolve as respostas HTTP de erro como `{ error }` e só
 * rejeita quando não há resposta, mas o que ele rejeita varia por runtime
 * (`TypeError` no navegador, `FetchError` do `expo/fetch` no app). Quem chama
 * `signIn.rest` embrulha a rejeição nesta classe, e a tradução abaixo não
 * precisa conhecer cada runtime.
 */
export class SemConexaoError extends Error {
    constructor(cause: unknown) {
        super("Auth request got no response.", { cause });
        this.name = "SemConexaoError";
    }
}

/**
 * Traduz a falha de `signIn.rest` para uma mensagem exibível, no web e no
 * mobile. O backend fala inglês nas falhas de credencial, e os dois apps
 * precisam da mesma tradução.
 *
 * Aceita um `SemConexaoError`, o `error` que o better-auth devolve ou um
 * `Error` que o embrulha em `cause` (o que o React Query recebe do
 * `mutationFn`).
 */
export function mensagemDeErroDeLogin(erro: unknown): string {
    if (erro instanceof SemConexaoError) {
        return "Sem conexão com o servidor. Confira sua internet e tente de novo.";
    }

    const error = erro instanceof Error && erro.cause ? erro.cause : erro;

    if (
        typeof error !== "object" ||
        error === null ||
        !("status" in error) ||
        typeof error.status !== "number"
    ) {
        return MENSAGEM_GENERICA;
    }

    // O plugin colapsa 403/404 em 401 de propósito, mas cobrimos os três para
    // não vazar um erro cru caso isso mude.
    if ([401, 403, 404].includes(error.status)) {
        return "E-mail ou senha inválidos.";
    }
    if (error.status === 429) {
        return "Muitas tentativas. Aguarde um instante e tente de novo.";
    }
    // Erros de validação chegam com mensagem do backend, segura de exibir.
    if (
        error.status === 400 &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }
    return MENSAGEM_GENERICA;
}
