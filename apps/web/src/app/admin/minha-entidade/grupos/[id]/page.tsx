import { Suspense, use } from "react";
import { notFound } from "next/navigation";

import { proximaPagina } from "@te-inscreve/schemas";

import { DetalheGrupoPagina } from "~/features/entidades/grupos/detalhe-grupo-pagina";
import {
    TrilhaGrupo,
    TrilhaGrupoSkeleton,
} from "~/features/entidades/grupos/trilha-grupo";
import { HydrateClient, prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Grupo | Te Inscreve",
    description: "Formação de um grupo da entidade",
};

/** O mesmo tanto da cesta que a bancada embutida na grade usava. */
const INTEGRANTES_POR_PAGINA = 20;

/**
 * O detalhe de um grupo: a bancada de montar a formação, numa rota própria.
 *
 * Era um segundo estado de `grupos/page.tsx` — abrir um grupo trocava a
 * grade pela bancada sem sair da tela. Virou rota porque o "Voltar" pedido
 * aqui só é rápido de verdade com `<Link>`: navegação por URL reaproveita o
 * cache de rota do Next, então sair e voltar para a grade não perde rolagem
 * nem refaz a busca — o motivo por trás de `docs/fcp.md`, seção 6, valer
 * também para trás, não só para frente.
 *
 * O `id` vem da URL; um segmento que não é inteiro é 404 na hora, sem esperar
 * rede — é checagem de parâmetro, não leitura de dado, então cabe no corpo
 * síncrono da página (ver `docs/fcp.md`).
 *
 * Duas formas de voltar, de propósito: o "Voltar" é o gesto de um passo atrás,
 * sem esperar nada; a trilha ("Grupos › nome do grupo") é a outra ponta, que
 * também leva direto para "Grupos" mesmo sem ter chegado por ali. As duas
 * pintam com a casca — o "Voltar" não depende de nenhum dado do grupo, e por
 * isso fica fora do `<HydrateClient>`, e a trilha tem o próprio `<Suspense>`
 * pelo mesmo motivo: só ela espera o grupo chegar, não a bancada inteira.
 */
export default function GrupoDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const idGrupo = parseInteger(id);

    if (!idGrupo) notFound();

    void prefetch(trpc.grupo.getById.queryOptions({ id: idGrupo }));
    void prefetch(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: INTEGRANTES_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8 lg:h-full lg:min-h-0">
            <div className="flex flex-wrap items-center gap-2">
                <GoBackButton />

                <Suspense fallback={<TrilhaGrupoSkeleton />}>
                    <TrilhaGrupo id={idGrupo} />
                </Suspense>
            </div>

            <HydrateClient>
                <DetalheGrupoPagina
                    id={idGrupo}
                    integrantesPorPagina={INTEGRANTES_POR_PAGINA}
                />
            </HydrateClient>
        </div>
    );
}
