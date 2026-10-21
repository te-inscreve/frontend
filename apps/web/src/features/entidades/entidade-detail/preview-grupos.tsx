import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { ListaGrupos } from "./lista-grupos";
import { GRUPOS_NO_PAINEL } from "./lista-grupos-skeleton";

/**
 * Os primeiros grupos da entidade, para o painel.
 *
 * Mesmo desenho de `PreviewIntegrantes`: vive atrás de um `<Suspense>` e não
 * repete o disparo feito pela página — o query client é `cache`ado por
 * request, então aqui só se aguarda a promise já em voo. Uma página só;
 * montar a formação é na página do grupo.
 *
 * A mesma rota (`grupo.list`) alimenta esta leitura comum e a grade
 * infinita de `grupos/page.tsx` — são tipos de query diferentes
 * (`useQuery` aqui, `useInfiniteQuery` lá), então convivem no cache sem
 * conflito. Ver o mesmo arranjo em `integrante.list`.
 *
 * Não trata erro nenhum: falha de rede ou 500 sobem para o `error.tsx`.
 */
export async function PreviewGrupos() {
    const pagina = await getQueryClient().fetchQuery(
        trpc.grupo.list.queryOptions({ pageSize: GRUPOS_NO_PAINEL }),
    );

    return <ListaGrupos grupos={pagina.items} total={pagina.totalItems} />;
}
