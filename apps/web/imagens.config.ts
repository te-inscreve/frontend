/**
 * O portão do `next/image`: de onde a aplicação pode buscar imagem.
 *
 * Mora fora do `next.config.js` e entra lá pelo `jiti` — o mesmo carregador que
 * a validação de env já usa. São regras com motivo, e não chaves de
 * configuração: a conta de host local abaixo existe por causa de uma proteção
 * do otimizador, e explicá-la no meio do objeto de config afastaria as opções do
 * Next umas das outras.
 *
 * `process.env` cru, e não o `env` validado, porque quem lê isto é o build antes
 * de a aplicação existir — é a mesma leitura que `allowedDevOrigins` faz logo ao
 * lado.
 */

/** De onde o `next/image` pode buscar imagem, declarado em `IMAGE_PROVIDERS`. */
export const provedoresDeImagem =
    process.env.IMAGE_PROVIDERS?.split(",")
        .filter((pattern) => !!pattern)
        .map((pattern) => new URL(pattern)) ?? [];

/**
 * O otimizador do `next/image` recusa host que resolva para IP privado — é a
 * proteção dele contra SSRF. `localhost` entra nessa conta (resolve para
 * `127.0.0.1`), e a faixa 10/172.16-31/192.168 também.
 */
export const ehHostLocal = (hostname: string) =>
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "[::1]" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
