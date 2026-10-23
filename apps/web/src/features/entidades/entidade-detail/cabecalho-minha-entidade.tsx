import { premiacoesMock } from "~/features/entidades/entidade-detail/mock-entidade";
import { BotaoEditarEntidade } from "~/features/entidades/form-entidade/botao-editar-entidade";
import { SolicitarAcesso } from "~/features/entidades/solicitar-acesso/solicitar-acesso";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { CabecalhoEntidade } from "./cabecalho-entidade";

/**
 * O cabeçalho do painel, alimentado pela entidade de quem está logado.
 *
 * Vive em um `<Suspense>` para não segurar o resto da página. Não repete o
 * disparado pela página: o query client é `cache`ado por request, então aqui
 * só se aguarda a promise já em voo.
 *
 * Não trata erro nenhum: falha de rede ou 500 sobem para o `error.tsx`, que é
 * onde um problema de infraestrutura deve aparecer. Engolir tudo aqui fazia o
 * backend fora do ar se passar por conta sem vínculo.
 */
export async function CabecalhoMinhaEntidade() {
    const entidade = await getQueryClient().fetchQuery(
        trpc.entidade.minha.queryOptions(),
    );

    // Só se chega aqui com o perfil dizendo que há vínculo, então um `null` —
    // 404 ou 403 no `/minha-entidade` — significa que o perfil e o recurso da
    // entidade discordam. Vale mais oferecer o pedido de acesso do que estourar
    // no acesso aos totais logo abaixo.
    if (!entidade) return <SolicitarAcesso />;

    return (
        <CabecalhoEntidade
            entidade={entidade}
            integrantes={entidade.totalIntegrantes}
            grupos={entidade.totalGrupos}
            // A sala de troféus ainda é mock: o total vem de lá até a API
            // expor as premiações.
            trofeus={premiacoesMock.length}
            acoes={<BotaoEditarEntidade entidade={entidade} />}
        />
    );
}
