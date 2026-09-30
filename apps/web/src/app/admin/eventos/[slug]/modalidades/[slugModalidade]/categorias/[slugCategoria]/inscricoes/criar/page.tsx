import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr";

import { proximaPagina } from "@te-inscreve/schemas";

import { PortaoDaEntidade } from "~/features/entidades/solicitar-acesso/portao-da-entidade";
import { BancadaInscricao } from "~/features/inscricoes/bancada-inscricao";
import { BancadaInscricaoSkeleton } from "~/features/inscricoes/bancada-inscricao-skeleton";
import { TrilhaInscricao } from "~/features/inscricoes/trilha-inscricao";
import { HydrateClient, prefetch, trpc } from "~/shared/api/trpc/server";
import { TrilhaEventoSkeleton } from "~/shared/ui/trilha-evento";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Criar inscrição | Te Inscreve",
    description: "Inscrição da entidade em uma categoria",
};

/** O mesmo da grade de `minha-entidade/grupos`, para partilhar o cache. */
const GRUPOS_POR_PAGINA = 12;
/** O mesmo da cesta de `minha-entidade/grupos/[id]`, pelo mesmo motivo. */
const INTEGRANTES_POR_PAGINA = 20;

/**
 * A página de criar inscrição: a entidade de quem está logado escolhe quem
 * se apresenta na categoria — um grupo (com exclusões) e/ou integrantes
 * avulsos.
 *
 * Os três ids vêm dos segmentos da rota; um que não é inteiro é 404 na hora,
 * sem esperar rede — é checagem de parâmetro, e cabe no corpo síncrono da
 * página (`docs/fcp.md`).
 *
 * Seis `prefetch`, todos antes do portão: evento e categoria (a trilha),
 * modalidade (os limites no pé do bilhete), entidade (o título da coluna) e
 * as duas listas infinitas (as abas). Disparados aqui, correm em paralelo
 * com a leitura do perfil que o portão faz — quem não tem entidade paga
 * requisições que falham em silêncio (`prefetch` engole a rejeição, e
 * `entidade.minha` devolve `null` em vez de lançar), troca aceitável por
 * quem tem entidade não esperar duas rodadas.
 *
 * O portão é a exceção 2 de `docs/fcp.md`: ele decide se a bancada existe,
 * então o esqueleto cobre a bancada inteira. Trilha e título ficam fora dele
 * e pintam na hora. O `HydrateClient` fica *dentro* do portão porque é ali
 * que a árvore cliente começa: ele desidrata as queries acima com o estado
 * que tiverem — as pendentes vão serializadas e completam no navegador.
 */
export default function NovaInscricaoPage({
    params,
}: {
    params: Promise<{
        slug: string;
        slugModalidade: string;
        slugCategoria: string;
    }>;
}) {
    const { slug, slugModalidade, slugCategoria } = use(params);
    const eventoId = parseInteger(slug);
    const modalidadeId = parseInteger(slugModalidade);
    const categoriaId = parseInteger(slugCategoria);

    if (!eventoId || !categoriaId || !modalidadeId) notFound();

    void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));
    void prefetch(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    void prefetch(
        trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }),
    );
    void prefetch(trpc.entidade.minha.queryOptions());
    void prefetch(
        trpc.grupo.list.infiniteQueryOptions(
            { pageSize: GRUPOS_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );
    void prefetch(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: INTEGRANTES_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8 lg:h-full lg:min-h-0">
            <Suspense fallback={<TrilhaEventoSkeleton />}>
                <TrilhaInscricao
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                    categoriaId={categoriaId}
                />
            </Suspense>

            <div className="text-primary flex items-center gap-2">
                <TicketIcon className="h-6 w-6" weight="duotone" />
                <h1 className="text-2xl font-bold tracking-tight">
                    Criar Inscrição
                </h1>
            </div>

            <Suspense fallback={<BancadaInscricaoSkeleton />}>
                <PortaoDaEntidade>
                    <HydrateClient>
                        <BancadaInscricao
                            eventoId={eventoId}
                            modalidadeId={modalidadeId}
                            categoriaId={categoriaId}
                            gruposPorPagina={GRUPOS_POR_PAGINA}
                            integrantesPorPagina={INTEGRANTES_POR_PAGINA}
                        />
                    </HydrateClient>
                </PortaoDaEntidade>
            </Suspense>
        </div>
    );
}
