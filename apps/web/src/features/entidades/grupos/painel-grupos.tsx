"use client";

import { MotionConfig } from "motion/react";

import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { ColunaIntegrantes } from "./coluna-integrantes";
import { DetalheGrupo } from "./detalhe-grupo";
import { GradeGrupos } from "./grade-grupos";
import { usePainelGrupos } from "./use-painel-grupos";

export { INTEGRANTES_POR_PAGINA } from "./use-painel-grupos";

/**
 * A tela de grupos: quem a entidade tem, de um lado, e como essa gente está
 * agrupada, do outro.
 *
 * São duas metades que não se substituem. À esquerda, estreita e rolando por
 * conta própria, a lista de integrantes da entidade; à direita, larga, os grupos
 * — a grade deles ou o detalhe de um. Abrir um grupo troca só a metade da
 * direita, e é isso que dá sentido à divisão: montar a formação é olhar a
 * entidade inteira e o grupo ao mesmo tempo, clicando de um lado para o outro.
 *
 * A coluna fica à esquerda porque é ela que se lê primeiro e não muda: a pessoa
 * escolhe gente lá e vê o resultado aqui. Em telas estreitas as duas viram uma
 * pilha, com os grupos por cima — sem espaço para os dois lados, o assunto da
 * tela é o grupo, e a lista é o material de trabalho embaixo.
 *
 * O `MotionConfig` com `reducedMotion="user"` vale para o cartão que viaja entre
 * os dois lados: o `ExpandableDialog` traz o seu por dentro, mas a animação
 * daqui é da tela, e sem este aviso ela ignoraria quem pediu menos movimento no
 * sistema. Ver a seção 5 de `docs/animacoes.md`.
 *
 * Os grupos são mock em memória enquanto a rota tRPC não existe; ver
 * {@link usePainelGrupos} e `mock-grupos.ts`.
 */
export function PainelGrupos() {
    const painel = usePainelGrupos();
    // Em variável para o TypeScript estreitar o tipo dentro dos callbacks: lido
    // do objeto, `grupoAberto` volta a ser "ou nulo" em cada fechamento.
    const { grupoAberto } = painel;
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: painel.carregarMais,
    });

    return (
        <MotionConfig reducedMotion="user">
            <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[22rem_minmax(0,1fr)]">
                {/* A coluna vem primeiro no DOM, e o grid a joga para baixo no
                celular (`order`): quem navega por teclado ou leitor de tela
                encontra a lista na ordem em que ela é usada, e quem olha a tela
                estreita vê o grupo antes do material. */}
                <div className="order-2 lg:order-1">
                    <ColunaIntegrantes
                        integrantes={painel.integrantes}
                        total={painel.total}
                        carregando={painel.carregando}
                        erro={painel.erro}
                        isFetchingNextPage={painel.isFetchingNextPage}
                        sentinelaRef={triggerScrollRef}
                        filtros={painel.filtros}
                        onFiltrosChange={painel.setFiltros}
                        grupoAberto={grupoAberto?.nome ?? null}
                        onAlternarIntegrante={painel.alternarIntegrante}
                        onIncluirTodos={painel.incluirVisiveis}
                        onEditar={painel.editarIntegrante}
                    />
                </div>

                <div className="order-1 lg:order-2">
                    {grupoAberto ? (
                        <DetalheGrupo
                            grupo={grupoAberto}
                            onVoltar={() => painel.abrirGrupo(null)}
                            onEditar={(dados) =>
                                painel.editarGrupo(grupoAberto.id, dados)
                            }
                            onExcluir={() =>
                                painel.excluirGrupo(grupoAberto.id)
                            }
                            onAlternarIntegrante={painel.alternarIntegrante}
                        />
                    ) : (
                        <GradeGrupos
                            grupos={painel.grupos}
                            onAbrir={painel.abrirGrupo}
                            onCriar={painel.criarGrupo}
                        />
                    )}
                </div>
            </div>
        </MotionConfig>
    );
}
