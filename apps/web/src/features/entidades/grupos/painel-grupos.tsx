"use client";

import { MotionConfig } from "motion/react";

import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { SetaDaBancada } from "./bancada";
import { ColunaIntegrantes } from "./coluna-integrantes";
import { DetalheGrupo } from "./detalhe-grupo";
import { GradeGrupos } from "./grade-grupos";
import { TrilhaGrupo } from "./trilha-grupo";
import { usePainelGrupos } from "./use-painel-grupos";

export { INTEGRANTES_POR_PAGINA } from "./use-painel-grupos";

/**
 * A tela de grupos, em dois estados.
 *
 * **Fechada**, é só a lista de grupos, ocupando a largura inteira: a pergunta da
 * tela é "que grupos a entidade tem", e nada mais precisa estar em cena.
 *
 * **Aberta em um grupo**, vira uma bancada de duas mãos — a cesta de integrantes
 * à esquerda, o grupo à direita, e entre as duas a seta do sentido. É a forma de
 * uma lista de opções que se despeja em um balde: clicar alguém na cesta manda a
 * pessoa para o grupo, clicar de novo no grupo devolve. As duas mãos usam a
 * mesma moldura ({@link LadoDaBancada}) porque são duas metades da mesma tarefa.
 *
 * A cesta só existe no estado aberto, e é o que a justifica: ela não é a
 * listagem de integrantes — essa tem tela própria —, é o material de uma
 * montagem. Sem grupo para receber gente, os cartões dela não teriam para onde
 * ir, já que no modo de seleção eles não abrem o detalhe da pessoa (ver
 * {@link CartaoIntegranteSelecao}).
 *
 * A trilha fica acima das duas mãos, e não dentro de uma: ela diz em que estado
 * a tela está e é por onde se fecha o grupo.
 *
 * As duas mãos têm a mesma altura e a mesma superfície, e cada uma rola por
 * dentro: uma bancada é uma superfície só, e dois painéis de alturas diferentes
 * lado a lado se liam como duas seções que calharam de estar juntas. Entre elas,
 * a {@link SetaDaBancada} é o botão que despeja a cesta inteira no grupo.
 *
 * A altura é herdada, não calculada: a casca da rota já vale a tela menos o
 * cabeçalho do admin, e daí para baixo é tudo `flex-1` com `min-h-0` até as
 * listas. Um `calc` com o cabeçalho, o padding e a trilha somados à mão erra
 * assim que qualquer um dos três muda — e o erro aparece como barra de rolagem
 * na página inteira, que é justamente o que a bancada não pode ter: rolar é das
 * listas, não da tela.
 *
 * Em telas estreitas as mãos viram uma pilha, com o grupo por cima (`order`) e a
 * cesta embaixo — sem espaço para os dois lados, o assunto é o grupo e a cesta é
 * o material. A cesta vem primeiro no DOM mesmo assim: quem navega por teclado
 * ou leitor de tela encontra a lista na ordem em que ela é usada.
 *
 * O `MotionConfig` com `reducedMotion="user"` vale para o cartão que viaja entre
 * as duas mãos: o `ExpandableDialog` traz o seu por dentro, mas a animação daqui
 * é da tela, e sem este aviso ela ignoraria quem pediu menos movimento no
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

    if (!grupoAberto) {
        return (
            <GradeGrupos
                grupos={painel.grupos}
                onAbrir={painel.abrirGrupo}
                onCriar={painel.criarGrupo}
            />
        );
    }

    return (
        <MotionConfig reducedMotion="user">
            <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
                <TrilhaGrupo
                    nome={grupoAberto.nome}
                    onVoltar={() => painel.abrirGrupo(null)}
                />

                {/* A coluna do meio é a seta, e por isso é `auto`: ela tem a
                    largura do próprio chip.

                    A altura das mãos vem daqui, e não de um `calc` em cada uma:
                    a grade toma o que sobrou da coluna (`flex-1`) depois da
                    trilha, e `items-stretch` dá esse mesmo tanto às três
                    colunas. Ninguém soma cabeçalho, padding e trilha à mão — e
                    por isso a página não ganha barra de rolagem quando alguma
                    delas muda de tamanho.

                    `grid-rows-[minmax(0,1fr)]` é o que fecha a conta: linha de
                    grade é `auto` por padrão, e `auto` cresce até o conteúdo
                    mais alto em vez de caber no container. Sem isso a grade
                    media os 564px certos e a linha dentro dela media os 692 da
                    lista inteira, empurrando a página de volta. */}
                <div className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch xl:grid-cols-[22rem_auto_minmax(0,1fr)]">
                    <ColunaIntegrantes
                        integrantes={painel.integrantes}
                        total={painel.total}
                        entidadeVazia={painel.entidadeVazia}
                        carregando={painel.carregando}
                        erro={painel.erro}
                        isFetchingNextPage={painel.isFetchingNextPage}
                        sentinelaRef={triggerScrollRef}
                        filtros={painel.filtros}
                        onFiltrosChange={painel.setFiltros}
                        grupo={grupoAberto.nome}
                        onAlternarIntegrante={painel.alternarIntegrante}
                        className="order-2 lg:order-1"
                    />

                    <SetaDaBancada
                        quantidade={painel.integrantes.length}
                        grupo={grupoAberto.nome}
                        onIncluirTodos={painel.incluirVisiveis}
                    />

                    <DetalheGrupo
                        grupo={grupoAberto}
                        onEditar={(dados) =>
                            painel.editarGrupo(grupoAberto.id, dados)
                        }
                        onExcluir={() => painel.excluirGrupo(grupoAberto.id)}
                        onAlternarIntegrante={painel.alternarIntegrante}
                        className="order-1 lg:order-3"
                    />
                </div>
            </div>
        </MotionConfig>
    );
}
