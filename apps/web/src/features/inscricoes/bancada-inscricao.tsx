"use client";

import { MotionConfig } from "motion/react";

import { ColunaEntidade } from "./coluna-entidade";
import { TicketInscricao } from "./ticket-inscricao";
import { useInscricao } from "./use-inscricao";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    gruposPorPagina: number;
    integrantesPorPagina: number;
}

/**
 * A bancada de criar inscrição: o que a entidade tem à esquerda, o bilhete
 * de quem vai à direita.
 *
 * Espelha a {@link DetalheGrupoPagina}: a mesma grade de três colunas, as
 * duas mãos com a mesma altura e cada uma rolando por dentro, a altura
 * herdada da página (`flex-1`+`min-h-0`) em vez de calculada. A coluna do
 * meio é só o tracejado — aqui não há "mandar todo mundo": escolher um grupo
 * já é o gesto de inscrever a formação inteira.
 *
 * Em telas estreitas vira uma pilha com o bilhete por cima (`order`): sem
 * espaço para os dois lados, o assunto é a inscrição e a entidade é o
 * material. A coluna da entidade vem primeiro no DOM mesmo assim, para quem
 * navega por teclado encontrar a lista na ordem em que ela é usada.
 *
 * `MotionConfig reducedMotion="user"` vale para as linhas do bilhete, que
 * entram e saem animando: sem o aviso, o Motion ignoraria quem pediu menos
 * movimento no sistema. Ver a seção 5 de `docs/animacoes.md`.
 */
export function BancadaInscricao(props: Props) {
    const inscricao = useInscricao(props);

    return (
        <MotionConfig reducedMotion="user">
            {/* `grid-rows-[minmax(0,1fr)]` fecha a conta da altura — ver o
                comentário equivalente em `detalhe-grupo-pagina.tsx`. */}
            <div className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch xl:grid-cols-[22rem_auto_minmax(0,1fr)]">
                <ColunaEntidade
                    entidade={inscricao.entidade?.nome ?? null}
                    grupos={inscricao.grupos}
                    integrantes={inscricao.integrantes}
                    grupoSelecionado={inscricao.selecao.grupo?.id ?? null}
                    selecionados={inscricao.selecionados}
                    onEscolherGrupo={inscricao.escolherGrupo}
                    onAlternarIntegrante={inscricao.alternarIntegrante}
                    className="order-2 lg:order-1"
                />

                <span
                    aria-hidden="true"
                    className="border-border/70 hidden border-l border-dashed lg:order-2 lg:block"
                />

                <TicketInscricao
                    categoria={inscricao.categoria}
                    modalidade={inscricao.modalidade}
                    selecao={inscricao.selecao}
                    linhas={inscricao.linhasDoTicket}
                    carregandoGrupo={inscricao.grupoDetalhe.carregando}
                    onAlternarIntegrante={inscricao.alternarIntegrante}
                    onCriar={inscricao.criarInscricao}
                    ultimoEnvio={inscricao.ultimoEnvio}
                    className="order-1 lg:order-3"
                />
            </div>
        </MotionConfig>
    );
}
