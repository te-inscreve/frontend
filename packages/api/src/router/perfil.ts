import type { TRPCRouterRecord } from "@trpc/server";

import type { Perfil } from "@te-inscreve/schemas";

import { authenticatedProcedure } from "../trpc";

export const perfilRouter = {
    /**
     * Perfil do usuário da sessão.
     *
     * Sem `next.revalidate` de propósito: a resposta muda conforme o JWT que vai
     * no cabeçalho, e o cache de dados do Next é por URL — guardar isso serviria
     * o perfil de um usuário para o próximo.
     */
    me: authenticatedProcedure.query(async ({ ctx }) => {
        const result = await ctx.restClient.get<Perfil>(`/profile`);

        // Conta sem perfil ainda cadastrado é um estado normal da tela, não uma
        // falha: a página oferece o cadastro em vez de mostrar um erro.
        if (!result.ok) {
            if (result.status === 404) return null;
            throw result.error;
        }

        return result.data;
    }),
} satisfies TRPCRouterRecord;
