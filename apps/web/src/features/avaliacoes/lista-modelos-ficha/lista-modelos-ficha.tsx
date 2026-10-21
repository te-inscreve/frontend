import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { BotaoCriarModeloFicha } from "../ficha-avaliativa/botao-criar-modelo-ficha";
import { CartaoModeloFicha } from "../ficha-avaliativa/cartao-modelo-ficha";

/** A mesma grade do seletor de modelo, com mais colunas no espaço da página. */
export const GRADE_MODELOS_FICHA =
    "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/**
 * Os modelos de ficha da entidade, com o atalho de criar na primeira vaga.
 *
 * O `fetchQuery` reaproveita o `prefetch` disparado pela página: o query client
 * é `cache`ado por request, então aqui só se aguarda a promise já em voo.
 */
export async function ListaModelosFicha() {
    const modelos = await getQueryClient().fetchQuery(
        trpc.fichaAvaliativa.getAll.queryOptions({}),
    );

    return (
        <div className="flex flex-col gap-4">
            <ul className={GRADE_MODELOS_FICHA}>
                <BotaoCriarModeloFicha />
                {modelos.map((modelo) => (
                    <CartaoModeloFicha key={modelo.id} modelo={modelo} />
                ))}
            </ul>
            {modelos.length === 0 && (
                <p className="text-muted-foreground py-12 text-center text-sm">
                    Nenhum modelo de ficha ainda. Crie o primeiro para usar nas
                    categorias dos seus eventos.
                </p>
            )}
        </div>
    );
}
