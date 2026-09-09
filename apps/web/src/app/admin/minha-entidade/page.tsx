import { Suspense } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import { Button } from "@te-inscreve/components";

import { AvisoDadosExemplo } from "~/features/entidades/entidade-detail/aviso-dados-exemplo";
import { CabecalhoEntidadeSkeleton } from "~/features/entidades/entidade-detail/cabecalho-entidade-skeleton";
import { CabecalhoMinhaEntidade } from "~/features/entidades/entidade-detail/cabecalho-minha-entidade";
import { ListaGrupos } from "~/features/entidades/entidade-detail/lista-grupos";
import { ListaIntegrantes } from "~/features/entidades/entidade-detail/lista-integrantes";
import { ListaPremiacoes } from "~/features/entidades/entidade-detail/lista-premiacoes";
import {
    gruposMock,
    integrantesMock,
    premiacoesMock,
} from "~/features/entidades/entidade-detail/mock-entidade";
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
 * Só o cadastro da entidade — e os totais de integrantes e grupos — vem da
 * API; as listas, as inscrições e as premiações seguem em `mock-entidade.ts`
 * até o backend expor esses recursos.
 *
 * Não checa vínculo: o layout do segmento já o faz por todas as rotas daqui,
 * e troca esta página pelo pedido de acesso quando não há nenhum.
 */
export default function MinhaEntidadePage() {
    void prefetch(trpc.entidade.minha.queryOptions());

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
            <div className="flex flex-col gap-4">
                <Suspense fallback={<CabecalhoEntidadeSkeleton />}>
                    <CabecalhoMinhaEntidade />
                </Suspense>
                <AvisoDadosExemplo />
            </div>

            {/* <Secao
                titulo="Evento atual"
                descricao="O evento em que a entidade está inscrita agora."
                icone={<CalendarDotsIcon size={20} weight="duotone" />}
            >
                <EventoAtual evento={eventoAtualMock} />
            </Secao> */}

            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <Secao
                        titulo="Integrantes"
                        descricao="Quem faz parte da entidade."
                        icone={<UsersThreeIcon size={20} weight="duotone" />}
                        acao={
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/admin/minha-entidade/integrantes">
                                    Ver todos
                                    <ArrowRightIcon
                                        aria-hidden="true"
                                        className="size-3"
                                    />
                                </Link>
                            </Button>
                        }
                    >
                        {/* O painel resume; cadastrar e filtrar é na tela de
                            integrantes. */}
                        <ListaIntegrantes
                            integrantes={integrantesMock.slice(0, 5)}
                        />
                    </Secao>
                </div>

                <div className="lg:col-span-3">
                    <Secao
                        titulo="Grupos"
                        descricao="As formações que se inscrevem nas modalidades coletivas."
                        icone={<UsersFourIcon size={20} weight="duotone" />}
                    >
                        <ListaGrupos
                            grupos={gruposMock}
                            integrantes={integrantesMock}
                        />
                    </Secao>
                </div>
            </div>

            <Secao
                titulo="Sala de troféus"
                descricao="Colocações da entidade nos últimos eventos."
                icone={<TrophyIcon size={20} weight="duotone" />}
            >
                <ListaPremiacoes premiacoes={premiacoesMock} />
            </Secao>
        </div>
    );
}
