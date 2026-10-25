import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import {
    FichasDaInscricao,
    FichasDaInscricaoSkeleton,
} from "~/features/avaliacoes/avaliacao-preenchida/fichas-da-inscricao";
import { TrilhaAvaliacao } from "~/features/avaliacoes/avaliacao-preenchida/trilha-avaliacao";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Avaliações | Te Inscreve",
    description: "As fichas avaliativas preenchidas de uma inscrição",
};

export default function AvaliacoesDaInscricaoPage({
    params,
}: {
    params: Promise<{
        slug: string;
        slugModalidade: string;
        slugCategoria: string;
        slugInscricao: string;
    }>;
}) {
    const { slug, slugModalidade, slugCategoria, slugInscricao } = use(params);
    const eventoId = parseInteger(slug);
    const modalidadeId = parseInteger(slugModalidade);
    const categoriaId = parseInteger(slugCategoria);
    const inscricaoId = parseInteger(slugInscricao);

    if (!eventoId || !modalidadeId || !categoriaId || !inscricaoId) notFound();

    const caminho = { eventoId, modalidadeId, categoriaId, inscricaoId };
    const daCategoria = { eventoId, modalidadeId, categoriaId };

    // A lista das avaliações; o detalhe de cada uma depende dela e sai no
    // filho suspenso.
    void prefetch(trpc.avaliacao.getDaInscricao.queryOptions(caminho));
    // A classificação diz quem foi avaliado e a nota final.
    void prefetch(trpc.categoria.getResultados.queryOptions(daCategoria));
    // A ficha da categoria quase sempre é o modelo das avaliações: com ela já
    // aqui, a bancada não espera os detalhes para pedir o modelo.
    void prefetch(trpc.categoria.getFichaAvaliativa.queryOptions(daCategoria));
    void prefetch(trpc.categoria.getById.queryOptions(daCategoria));
    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <Suspense fallback={<TrilhaEventoSkeleton />}>
                <TrilhaAvaliacao caminho={caminho} />
            </Suspense>

            <div className="mx-auto w-full max-w-5xl">
                <Suspense fallback={<FichasDaInscricaoSkeleton />}>
                    <FichasDaInscricao caminho={caminho} />
                </Suspense>
            </div>
        </div>
    );
}
