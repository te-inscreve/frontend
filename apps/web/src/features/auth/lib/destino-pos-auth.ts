/**
 * Reduz um `next` vindo de fora a um caminho interno seguro, ou à home.
 *
 * O `next` vem da query string, então quem monta o link é quem manda: um
 * `/signin?next=https://evil.com` jogaria o usuário para fora do site no
 * instante em que ele entra, com a sessão recém-criada. Não basta exigir a
 * barra inicial — o navegador lê `//evil.com` e `/\evil.com` como
 * protocol-relative (outra origem disfarçada de caminho) e descarta tab, LF e
 * CR antes de resolver a URL, de modo que `/{TAB}/evil.com` vira `//evil.com`.
 * Daí limpar esses caracteres primeiro e validar o que sobrou, que é
 * exatamente o que o navegador vai enxergar.
 *
 * Recebe o valor já decodificado e não encosta em `window`: o proxy chama a
 * mesma função no servidor para decidir para onde mandar quem já tem sessão, e
 * a regra precisa ser uma só nos dois lados.
 */
export function caminhoInternoSeguro(next: string | null): string {
    if (!next) return "/";

    const limpo = next.replace(/[\t\n\r]/g, "");

    if (!limpo.startsWith("/")) return "/";
    if (limpo.startsWith("//") || limpo.startsWith("/\\")) return "/";

    return limpo;
}

/**
 * Para onde levar o usuário depois de entrar ou se cadastrar: o `next` que o
 * proxy anexa ao mandar alguém para o login, ou a home.
 *
 * Lê a URL no momento do envio em vez de usar `useSearchParams()` de propósito:
 * o destino só interessa dentro do handler, e o hook obrigaria as páginas de
 * login e cadastro — hoje estáticas — a ficarem atrás de um `<Suspense>`, o que
 * trocaria o formulário por um esqueleto no HTML gerado no build.
 */
export function destinoPosAuth(): string {
    return caminhoInternoSeguro(
        new URLSearchParams(window.location.search).get("next"),
    );
}
