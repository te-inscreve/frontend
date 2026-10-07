"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { MotionConfig } from "motion/react";

import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { LadoDaBancada, SetaDaBancada } from "./bancada";
import { ColunaIntegrantes } from "./coluna-integrantes";
import { DetalheGrupo } from "./detalhe-grupo";
import { DetalheGrupoSkeleton } from "./detalhe-grupo-skeleton";
import { useDetalheGrupo } from "./use-detalhe-grupo";

interface Props {
    id: number;
    integrantesPorPagina: number;
}

/**
 * A bancada de um grupo: a cesta de integrantes à esquerda, o grupo à
 * direita, e entre as duas a seta do sentido. É a forma de uma lista de
 * opções que se despeja em um balde: clicar alguém na cesta manda a pessoa
 * para o grupo, clicar de novo no grupo devolve. As duas mãos usam a mesma
 * moldura ({@link LadoDaBancada}) porque são duas metades da mesma tarefa.
 *
 * Vive na própria rota do grupo (`grupos/[id]/page.tsx`) — ver o JSDoc de lá
 * para o porquê da separação. O "Voltar" para a grade é da página, não daqui:
 * ele não depende de nenhum dado desta bancada, e pinta com a casca.
 *
 * As duas mãos têm a mesma altura e a mesma superfície, e cada uma rola por
 * dentro: uma bancada é uma superfície só, e dois painéis de alturas diferentes
 * lado a lado se liam como duas seções que calharam de estar juntas. Entre elas,
 * a {@link SetaDaBancada} é o botão que despeja a cesta inteira no grupo.
 *
 * A altura é herdada, não calculada: a página já deixa esta caixa com
 * `flex-1`+`min-h-0` do que sobrou do "Voltar", e daí para baixo é a grade que
 * dá a mesma altura às três colunas (`items-stretch`). Ninguém soma cabeçalho,
 * padding e botão à mão — e por isso a página não ganha barra de rolagem
 * quando algum deles muda de tamanho.
 *
 * Em telas estreitas as mãos viram uma pilha, com o grupo por cima (`order`) e a
 * cesta embaixo — sem espaço para os dois lados, o assunto é o grupo e a cesta é
 * o material. A cesta vem primeiro no DOM mesmo assim: quem navega por teclado
 * ou leitor de tela encontra a lista na ordem em que ela é usada.
 *
 * O `MotionConfig` com `reducedMotion="user"` vale para os cartões que entram e
 * saem das duas mãos: o `ExpandableDialog` traz o seu por dentro, mas a animação
 * daqui é da tela, e sem este aviso ela ignoraria quem pediu menos movimento no
 * sistema. Ver a seção 5 de `docs/animacoes.md`.
 *
 * O nome do grupo não é conhecido antes de `grupo.getById` responder — ao
 * contrário da antiga bancada embutida na grade, que já sabia o nome de quem
 * clicou. Por isso a cesta e a seta usam "…" como rótulo enquanto o detalhe
 * não chega; o esqueleto do lado direito nem tenta mostrar um nome — ver
 * {@link DetalheGrupoSkeleton}.
 */
export function DetalheGrupoPagina({ id, integrantesPorPagina }: Props) {
    const painel = useDetalheGrupo({ id, integrantesPorPagina });
    const { grupoAberto } = painel;
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: painel.carregarMaisIntegrantes,
    });

    const nome = grupoAberto?.nome ?? "…";

    return (
        <MotionConfig reducedMotion="user">
            {/* A coluna do meio é a seta, e por isso é `auto`: ela tem a
                largura do próprio chip.

                `grid-rows-[minmax(0,1fr)]` é o que fecha a conta: linha de
                grade é `auto` por padrão, e `auto` cresce até o conteúdo
                mais alto em vez de caber no container. Sem isso a grade
                media a altura certa e a linha dentro dela media a da lista
                inteira, empurrando a página de volta. */}
            <div className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch xl:grid-cols-[22rem_auto_minmax(0,1fr)]">
                <ColunaIntegrantes
                    integrantes={painel.integrantes}
                    total={painel.total}
                    entidadeVazia={painel.entidadeVazia}
                    noGrupo={grupoAberto?.integrantes.length ?? 0}
                    carregando={painel.carregando}
                    erro={painel.erro}
                    isFetchingNextPage={painel.isFetchingNextPage}
                    sentinelaRef={triggerScrollRef}
                    filtros={painel.filtros}
                    grupo={nome}
                    onAlternarIntegrante={painel.alternarIntegrante}
                    className="order-2 lg:order-1"
                />

                <SetaDaBancada
                    quantidade={painel.integrantes.length}
                    grupo={nome}
                    onIncluirTodos={painel.incluirVisiveis}
                />

                {grupoAberto ? (
                    <DetalheGrupo
                        grupo={grupoAberto}
                        onEditar={painel.editarGrupo}
                        onExcluir={painel.excluirGrupo}
                        onAlternarIntegrante={painel.alternarIntegrante}
                        temMudancas={painel.formacaoMudou}
                        onSalvar={painel.salvarFormacao}
                        className="order-1 lg:order-3"
                    />
                ) : painel.carregandoDetalhe ? (
                    <DetalheGrupoSkeleton className="order-1 lg:order-3" />
                ) : (
                    // Sem detalhe e sem espera: o id não é mais de um grupo
                    // da entidade (404), ou a leitura falhou.
                    <LadoDaBancada
                        titulo="Grupo"
                        className="order-1 lg:order-3"
                    >
                        <p className="text-destructive flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm">
                            <BugIcon aria-hidden="true" size={18} />
                            {painel.erroDetalhe?.message ??
                                "Este grupo não existe mais."}
                        </p>
                    </LadoDaBancada>
                )}
            </div>
        </MotionConfig>
    );
}
