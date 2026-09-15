import { Suspense } from "react";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import { CabecalhoEntidadeSkeleton } from "~/features/entidades/entidade-detail/cabecalho-entidade-skeleton";
import { CabecalhoMinhaEntidade } from "~/features/entidades/entidade-detail/cabecalho-minha-entidade";
import {
    GRUPOS_NO_PAINEL,
    ListaGruposSkeleton,
} from "~/features/entidades/entidade-detail/lista-grupos-skeleton";
import {
    INTEGRANTES_NO_PAINEL,
    ListaIntegrantesSkeleton,
} from "~/features/entidades/entidade-detail/lista-integrantes-skeleton";
import { PreviewGrupos } from "~/features/entidades/entidade-detail/preview-grupos";
import { PreviewIntegrantes } from "~/features/entidades/entidade-detail/preview-integrantes";
import { Secao } from "~/features/entidades/entidade-detail/secao";
import { prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Minha Entidade | Te Inscreve",
    description:
        "Painel da entidade: integrantes, grupos, inscrições e premiações",
};

/**
 * Painel da entidade de quem está logado.
 *
 * A ordem das seções segue a urgência: primeiro o evento com prazo correndo,
 * depois quem a entidade tem para inscrever e, por último, o histórico.
 *
 * O cadastro da entidade — com os totais de integrantes e grupos —, a lista
 * de integrantes e a de grupos vêm da API; inscrições e premiações seguem em
 * `mock-entidade.ts` até o backend expor esses recursos.
 *
 * Não checa vínculo: o layout do segmento já o faz por todas as rotas daqui,
 * e troca esta página pelo pedido de acesso quando não há nenhum.
 */
export default function MinhaEntidadePage() {
    void prefetch(trpc.entidade.minha.queryOptions());
    void prefetch(
        trpc.integrante.list.queryOptions({ pageSize: INTEGRANTES_NO_PAINEL }),
    );
    void prefetch(trpc.grupo.list.queryOptions({ pageSize: GRUPOS_NO_PAINEL }));

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
            <Suspense fallback={<CabecalhoEntidadeSkeleton />}>
                <CabecalhoMinhaEntidade />
            </Suspense>

            {/* <Secao
                titulo="Evento atual"
                descricao="O evento em que a entidade está inscrita agora."
                icone={<CalendarDotsIcon size={20} weight="duotone" />}
            >
                <EventoAtual evento={eventoAtualMock} />
            </Secao> */}

            <div className="grid gap-8 lg:grid-cols-2">
                <Secao
                    titulo="Integrantes"
                    descricao="Quem faz parte da entidade."
                    icone={<UsersThreeIcon size={20} weight="duotone" />}
                >
                    {/* O painel resume; o rodapé da lista leva à tela de
                        integrantes, onde se cadastra e filtra. */}
                    <Suspense fallback={<ListaIntegrantesSkeleton />}>
                        <PreviewIntegrantes />
                    </Suspense>
                </Secao>

                <Secao
                    titulo="Grupos"
                    descricao="As formações que se inscrevem nas modalidades coletivas."
                    icone={<UsersFourIcon size={20} weight="duotone" />}
                >
                    {/* O painel resume; o "Ver mais" leva à tela de
                        grupos, onde se cria, exclui e monta a formação. */}
                    <Suspense fallback={<ListaGruposSkeleton />}>
                        <PreviewGrupos />
                    </Suspense>
                </Secao>
            </div>

            {/* <Secao
                titulo="Sala de troféus"
                descricao="Colocações da entidade nos últimos eventos."
                icone={<TrophyIcon size={20} weight="duotone" />}
            >
                <ListaPremiacoes premiacoes={premiacoesMock} />
            </Secao> */}
        </div>
    );
}
