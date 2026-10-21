import { Skeleton } from "@te-inscreve/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { BotaoRemoverFichaCategoria } from "./botao-remover-ficha-categoria";
import { BotaoSelecionarModeloFicha } from "./botao-selecionar-modelo-ficha";
import { CartaoModeloFicha } from "./cartao-modelo-ficha";
import { FichaAvaliativaVazia } from "./ficha-avaliativa-vazia";
import { previaDoDetalhe } from "./lib/previa-do-detalhe";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

/**
 * A aba de ficha avaliativa da categoria: o modelo vinculado, na mesma
 * prancheta do seletor e com os botões de trocá-lo e de removê-lo, ou o estado
 * vazio que leva até o seletor.
 *
 * Server Component atrás do seu próprio `<Suspense>`: o `fetchQuery`
 * reaproveita o `prefetch` disparado pela página.
 */
export async function FichaAvaliativaDaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: Props) {
    const modelo = await getQueryClient().fetchQuery(
        trpc.categoria.getFichaAvaliativa.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    if (!modelo) {
        return (
            <FichaAvaliativaVazia
                eventoId={eventoId}
                modalidadeId={modalidadeId}
                categoriaId={categoriaId}
            />
        );
    }

    return (
        <section
            aria-label="Ficha avaliativa vinculada"
            className="flex flex-col items-center justify-center gap-4"
        >
            <CartaoModeloFicha
                as="div"
                modelo={{ ...modelo, previa: previaDoDetalhe(modelo) }}
            />
            <div className="flex items-center gap-2">
                <BotaoSelecionarModeloFicha
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                    trocar
                />
                <BotaoRemoverFichaCategoria
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                    nomeModelo={modelo.nome}
                />
            </div>
        </section>
    );
}

/** A prancheta vazia, do tamanho da que vai chegar. */
export function FichaAvaliativaDaCategoriaSkeleton() {
    return (
        <div aria-hidden="true" className="grid grid-cols-2 gap-4">
            <div className="pt-2.5">
                <Skeleton className="aspect-3/4 w-full rounded-lg" />
            </div>
        </div>
    );
}
