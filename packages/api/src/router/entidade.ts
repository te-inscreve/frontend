import type { TRPCRouterRecord } from "@trpc/server";

import type { EntidadeOpcao, MinhaEntidade } from "@te-inscreve/schemas";
import { formEntidadeSchema } from "@te-inscreve/schemas";

import { tagsEntidades } from "../cache-tags";
import { authenticatedProcedure } from "../trpc";

export const entidadeRouter = {
    /**
     * Todas as entidades, só com o que identifica cada uma.
     *
     * Alimenta o select de quem ainda não tem vínculo e precisa pedir acesso.
     * Recurso público no backend, e o mesmo para todo mundo — daí poder ficar
     * no cache por 30 segundos com tag, ao contrário de `minha`.
     */
    getAll: authenticatedProcedure.query(async ({ ctx }) => {
        const result = await ctx.restClient.get<EntidadeOpcao[]>(`/entidades`, {
            next: { revalidate: 30, tags: tagsEntidades() },
        });
        if (!result.ok) throw result.error;
        return result.data;
    }),

    /**
     * A entidade de quem está logado.
     *
     * Sem `next.revalidate`, e não por isolamento: a chave do Data Cache do
     * Next inclui os headers do `fetch`, então o JWT no `authorization` já
     * separaria a entrada de cada usuário — é nisso que `perfil.me` se apoia
     * para poder guardar a resposta.
     *
     * O que segura o cache aqui é `atualizarMinha`: a tag seria a mesma para
     * todas as sessões, e derrubá-la a cada edição faria uma entidade invalidar
     * a leitura de todas as outras. Com o formulário salvando e a tela
     * repintando logo em seguida, o cache não pagaria o próprio preço.
     */
    minha: authenticatedProcedure.query(async ({ ctx }) => {
        const result =
            await ctx.restClient.get<MinhaEntidade>(`/minha-entidade`);

        // Conta sem entidade vinculada é um estado normal do painel, não uma
        // falha: a tela oferece o pedido de acesso em vez de mostrar um erro.
        //
        // O 403 entra junto com o 404 porque o backend usa os dois para o mesmo
        // fato — quem não tem vínculo não tem `/minha-entidade` para ver. Falta
        // de permissão de verdade não chega a esta rota: o portão do segmento
        // decide isso pelo perfil, antes.
        if (!result.ok) {
            if (result.status === 404 || result.status === 403) return null;
            throw result.error;
        }

        return result.data;
    }),

    /**
     * Edição do cadastro da própria entidade.
     *
     * O recurso não tem id no caminho: o backend descobre a entidade pelo JWT,
     * como no `minha`. `PATCH` e não `PUT` pelo mesmo motivo da categoria — o
     * serializer expõe campos que este formulário não edita, e um envio
     * parcial evita zerá-los sem querer.
     *
     * O nome editado aqui também aparece na listagem de `getAll`, que é
     * cacheada: quem chama precisa derrubar `tagsEntidades` depois.
     */
    atualizarMinha: authenticatedProcedure
        .input(formEntidadeSchema)
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.restClient.patch<MinhaEntidade>(
                `/minha-entidade`,
                input,
            );
            if (!result.ok) throw result.error;
            return result.data;
        }),
} satisfies TRPCRouterRecord;
