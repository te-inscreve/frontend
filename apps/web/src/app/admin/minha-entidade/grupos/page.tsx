import { proximaPagina } from "@te-inscreve/schemas";

import {
    INTEGRANTES_POR_PAGINA,
    PainelGrupos,
} from "~/features/entidades/grupos/painel-grupos";
import { HydrateClient, prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Grupos | Te Inscreve",
    description: "Grupos de integrantes da entidade",
};

/**
 * Tela de grupos da entidade.
 *
 * A primeira página de integrantes é disparada aqui e hidratada no painel, que é
 * um Client Component: é ele que rola, filtra e monta a formação dos grupos,
 * então a query precisa viver no navegador. Os grupos em si ainda não passam
 * pela API — ver `features/entidades/grupos/mock-grupos.ts`.
 *
 * Não checa vínculo: o layout do segmento já o faz por todas as rotas daqui.
 */
export default function GruposPage() {
    void prefetch(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: INTEGRANTES_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );

    return (
        // `lg:h-full` em vez de altura natural: com um grupo aberto, a bancada
        // precisa saber de quanta tela dispõe para caber sem empurrar a página.
        // A conta não é daqui — o `layout` do admin já deixa esta caixa com a
        // altura exata que sobrou do cabeçalho, e o `h-full` a herda. Assim
        // ninguém precisa somar cabeçalho, padding e trilha num `calc`.
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:h-full lg:min-h-0">
            <HydrateClient>
                <PainelGrupos />
            </HydrateClient>
        </div>
    );
}
