import type { TRPCRouterRecord } from "@trpc/server";

import type { Perfil } from "@te-inscreve/schemas";
import { secondsUntilRefresh } from "@te-inscreve/auth";

import { tagsPerfil } from "../cache-tags";
import { authenticatedProcedure } from "../trpc";

export const perfilRouter = {
    /**
     * Perfil do usuário da sessão.
     *
     * Guardado no Data Cache do Next, com dois limites:
     *
     * 1. **Isolamento.** A chave do cache inclui os headers do `fetch`, e não
     *    só a URL — o JWT no `authorization` já separa a entrada de cada
     *    sessão. Trocado o token, a chave muda junto e a entrada velha deixa
     *    de ser consultada.
     * 2. **Frescor.** `secondsUntilRefresh` é o teto — passado ele o token é
     *    outro —, mas um teto de horas seria longo demais: é daqui que sai o
     *    vínculo com a entidade, e quem acabou de ser vinculado veria a tela
     *    de "solicitar acesso" até a sessão renovar. Os 60 segundos existem
     *    para esse caso: enquanto não existir mutation de perfil, ninguém
     *    derruba a {@link tagsPerfil}, e o prazo é a única saída.
     *
     * Sem `exp` legível, `secondsUntilRefresh` devolve `0` e o Next não guarda
     * nada — o lado seguro do erro.
     */
    me: authenticatedProcedure.query(async ({ ctx }) => {
        const result = await ctx.restClient.get<Perfil>(`/profile`, {
            next: {
                revalidate: Math.min(secondsUntilRefresh(ctx.token), 60),
                tags: tagsPerfil(),
            },
        });

        // Conta sem perfil ainda cadastrado é um estado normal da tela, não uma
        // falha: a página oferece o cadastro em vez de mostrar um erro.
        if (!result.ok) {
            if (result.status === 404) return null;
            throw result.error;
        }

        return result.data;
    }),
} satisfies TRPCRouterRecord;
