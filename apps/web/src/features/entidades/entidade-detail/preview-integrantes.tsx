import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { ListaIntegrantes } from "./lista-integrantes";
import { INTEGRANTES_NO_PAINEL } from "./lista-integrantes-skeleton";

/**
 * As primeiras pessoas da entidade, para o painel.
 *
 * Vive em um `<Suspense>` para não segurar o resto da página, e não repete o
 * disparo feito por ela: o query client é `cache`ado por request, então aqui
 * só se aguarda a promise já em voo. Uma página só — cadastrar, filtrar e
 * rolar é na tela de integrantes.
 *
 * Não trata erro nenhum: falha de rede ou 500 sobem para o `error.tsx`.
 */
export async function PreviewIntegrantes() {
    const pagina = await getQueryClient().fetchQuery(
        trpc.integrante.list.queryOptions({ pageSize: INTEGRANTES_NO_PAINEL }),
    );

    return <ListaIntegrantes integrantes={pagina.items} />;
}
