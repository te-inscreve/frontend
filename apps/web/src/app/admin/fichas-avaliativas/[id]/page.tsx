import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import {
    DetalheModeloFicha,
    DetalheModeloFichaSkeleton,
} from "~/features/avaliacoes/ficha-avaliativa/detalhe-modelo-ficha";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Modelo de ficha | Te Inscreve",
    description: "Detalhe de um modelo de ficha avaliativa da entidade",
};

/**
 * Um modelo de ficha por inteiro: a prancheta do tamanho da tela e, ao lado,
 * o lugar das outras versões da família e das categorias de evento em que
 * cada versão foi usada.
 */
export default function ModeloFichaDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: slug } = use(params);
    const id = parseInteger(slug);

    if (!id) notFound();

    void prefetch(trpc.fichaAvaliativa.getById.queryOptions({ id }));

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <GoBackButton href="/admin/fichas-avaliativas" />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <Suspense fallback={<DetalheModeloFichaSkeleton />}>
                    <DetalheModeloFicha id={id} />
                </Suspense>

                {/* Cada lista entra no seu próprio `<Suspense>` quando ganhar
                    query; até lá, só o lugar delas. */}
                <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
                    <SecaoReservada
                        titulo="Versões"
                        descricao="As outras versões deste modelo vão aparecer aqui."
                    />
                    <SecaoReservada
                        titulo="Usada em"
                        descricao="As categorias de evento em que cada versão foi usada vão aparecer aqui."
                    />
                </aside>
            </div>
        </div>
    );
}

function SecaoReservada({
    titulo,
    descricao,
}: {
    titulo: string;
    descricao: string;
}) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {titulo}
            </h2>
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                {descricao}
            </p>
        </section>
    );
}
