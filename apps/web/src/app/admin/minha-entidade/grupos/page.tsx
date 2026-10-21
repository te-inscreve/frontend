import { proximaPagina } from "@te-inscreve/schemas";

import { PainelGrupos } from "~/features/entidades/grupos/painel-grupos";
import { HydrateClient, prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Grupos | Te Inscreve",
    description: "Grupos de integrantes da entidade",
};

/** Duas linhas cheias no maior breakpoint da grade, e mais uma para rolar. */
const GRUPOS_POR_PAGINA = 12;

/**
 * Tela de grupos da entidade: a grade, com o cadastro embutido no título.
 *
 * A primeira página é disparada aqui e hidratada no painel, que é um Client
 * Component: é ele que rola e pagina, então a query precisa viver no
 * navegador.
 *
 * A formação de um grupo tem rota própria — `grupos/[id]/page.tsx` — em vez
 * de ser um segundo estado desta tela. A separação é o que faz o "Voltar" de
 * lá ser instantâneo: navegar de volta para cá reaproveita o que o Next já
 * tem client-side, sem refazer a busca da grade nem perder rolagem — e é
 * também o que deixa esta página simples, sem prefetch de integrantes: a
 * cesta só existe onde ela é usada.
 *
 * Não checa vínculo: o layout do segmento já o faz por todas as rotas daqui.
 */
export default function GruposPage() {
    void prefetch(
        trpc.grupo.list.infiniteQueryOptions(
            { pageSize: GRUPOS_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
            <HydrateClient>
                <PainelGrupos pageSize={GRUPOS_POR_PAGINA} />
            </HydrateClient>
        </div>
    );
}
