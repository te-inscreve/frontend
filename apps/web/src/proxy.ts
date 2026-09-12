import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { caminhoInternoSeguro } from "./features/auth/lib/destino-pos-auth";
import { auth } from "./shared/api/auth/server";

/**
 * As portas de entrada. Ficam de fora `/signout`, que precisa da sessão viva
 * para conseguir encerrá-la.
 */
const ROTAS_DE_ENTRADA = ["/signin", "/signup"];

/**
 * O portão roda nos dois sentidos: manda para o login quem não tem sessão e
 * tira do login quem já tem. Sem o segundo sentido, quem está logado abre
 * `/signin` normalmente e vê um formulário que não faz sentido para ele.
 *
 * A checagem mora aqui, e não nas páginas, porque `/signin` e `/signup` são
 * geradas no build: ler a sessão dentro delas as tornaria dinâmicas.
 */
export async function proxy(request: NextRequest) {
    const _headers = await headers();
    const session = await auth.api.getSession({
        headers: _headers,
    });
    const { pathname, search } = request.nextUrl;
    const ehRotaDeEntrada = ROTAS_DE_ENTRADA.includes(pathname);

    if (session && ehRotaDeEntrada) {
        const nextPath = request.nextUrl.searchParams.get("next");
        const destino = new URL(
            caminhoInternoSeguro(
                nextPath?.startsWith("/") ? nextPath : `/${nextPath}`,
            ),
            request.url,
        );
        if (ROTAS_DE_ENTRADA.includes(destino.pathname)) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        return NextResponse.redirect(destino);
    }

    if (!session && !ehRotaDeEntrada) {
        // `encodeURIComponent` porque o destino carrega a query string junto:
        // sem escapar, o `?tab=x` de `/admin/eventos?tab=x` viraria um segundo
        // parâmetro do próprio `/signin` e o filtro se perderia na volta.
        const destino = encodeURIComponent(`${pathname}${search}`);

        return NextResponse.redirect(
            new URL(`/signin?next=${destino}`, request.url),
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/perfil/:path*", "/signin", "/signup"],
};
