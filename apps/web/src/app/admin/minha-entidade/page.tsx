import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import { AvisoDadosExemplo } from "~/features/entidades/entidade-detail/aviso-dados-exemplo";
import { CabecalhoEntidade } from "~/features/entidades/entidade-detail/cabecalho-entidade";
import { EventoAtual } from "~/features/entidades/entidade-detail/evento-atual";
import { ListaGrupos } from "~/features/entidades/entidade-detail/lista-grupos";
import { ListaIntegrantes } from "~/features/entidades/entidade-detail/lista-integrantes";
import { ListaPremiacoes } from "~/features/entidades/entidade-detail/lista-premiacoes";
import {
    entidadeMock,
    eventoAtualMock,
    gruposMock,
    integrantesMock,
    premiacoesMock,
} from "~/features/entidades/entidade-detail/mock-entidade";
import { Secao } from "~/features/entidades/entidade-detail/secao";

export const metadata = {
    title: "Minha Entidade | Te Inscreve",
    description:
        "Painel da entidade: integrantes, grupos, inscrições e premiações",
};

/**
 * Painel da entidade de quem está logado.
 *
 * A ordem das seções segue a urgência: primeiro o evento com prazo correndo,
 * depois quem a entidade tem para inscrever e, por último, o histórico. Todo o
 * conteúdo vem de `mock-entidade.ts` enquanto a API não expõe esses recursos —
 * por isso a página é síncrona e não busca nada.
 */
export default function MinhaEntidadePage() {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
            <div className="flex flex-col gap-4">
                <CabecalhoEntidade
                    entidade={entidadeMock}
                    integrantes={integrantesMock.length}
                    grupos={gruposMock.length}
                    trofeus={premiacoesMock.length}
                />
                <AvisoDadosExemplo />
            </div>

            <Secao
                titulo="Evento atual"
                descricao="O evento em que a entidade está inscrita agora."
                icone={<CalendarDotsIcon size={20} weight="duotone" />}
            >
                <EventoAtual evento={eventoAtualMock} />
            </Secao>

            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <Secao
                        titulo="Integrantes"
                        descricao="Quem faz parte da entidade."
                        icone={<UsersThreeIcon size={20} weight="duotone" />}
                    >
                        <ListaIntegrantes integrantes={integrantesMock} />
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
