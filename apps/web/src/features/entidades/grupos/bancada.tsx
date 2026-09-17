"use client";

import { useId } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";

import { cn } from "@te-inscreve/components";

import { contagemIntegrantes } from "./grupo";

interface Props {
    titulo: React.ReactNode;
    /** A linha miúda embaixo do título: o que este lado é, ou o que fazer nele. */
    descricao?: React.ReactNode;
    /** O canto direito do cabeçalho — o menu do grupo, por exemplo. */
    acoes?: React.ReactNode;
    /**
     * A linha de abas embaixo do título, quando este lado lista mais de uma
     * coisa. Fica no cabeçalho, e não no corpo, porque as abas dizem *o que
     * este lado lista* — são etiqueta, como o título, e moram na mesma
     * superfície clara dele. Quem passa a `TabsList` também envolve a
     * bancada inteira no `Tabs`: o Radix exige que lista e conteúdo estejam
     * sob o mesmo root.
     */
    abas?: React.ReactNode;
    /** Posição na grade e altura ficam com quem monta a bancada. */
    className?: string;
    children: React.ReactNode;
}

/**
 * Um dos dois lados da bancada de montar grupo.
 *
 * A tela de grupos é uma lista de opções e um balde: de um lado quem a entidade
 * tem, do outro o grupo sendo montado, e o gesto é mandar gente de lá para cá.
 * Este componente é a moldura que faz os dois lados se lerem como um par — mesmo
 * cabeçalho, mesmo raio, mesma borda, mesma superfície —, porque é a semelhança
 * entre eles que conta a história: são duas mãos da mesma tarefa, não duas
 * seções empilhadas por acaso.
 *
 * Os dois lados são iguais de propósito, e não mais um afundado e outro elevado.
 * Cada mão tem a mesma pilha de superfícies: cabeçalho claro em cima, corpo
 * afundado embaixo, cartão claro dentro do corpo. O que diz de que lado a pessoa
 * está é a posição e o sinal no cartão (`+` de um lado, `−` do outro), não a cor
 * do painel.
 *
 * A moldura é só do estado aberto. A lista de grupos ({@link GradeGrupos}) não a
 * usa: fechada, a tela é uma listagem como a de integrantes, e listagem não tem
 * painel em volta. A bancada aparece junto com o trabalho que ela emoldura.
 *
 * O `h2` é o rótulo acessível da região (`aria-labelledby`): quem navega por
 * marcos ouve "Integrantes" e "nome do grupo" como duas regiões nomeadas, que é
 * exatamente a divisão que a tela mostra.
 */
export function LadoDaBancada({
    titulo,
    descricao,
    acoes,
    abas,
    className,
    children,
}: Props) {
    const tituloId = useId();

    return (
        <section
            aria-labelledby={tituloId}
            className={cn(
                "bg-muted/40 flex min-w-0 flex-col rounded-xl border",
                className,
            )}
        >
            {/* Claro sobre o corpo afundado: o cabeçalho é a etiqueta da mão,
                e as duas etiquetas acesas lado a lado fecham a bancada por cima
                — embaixo delas fica a área de trabalho, recuada.

                `rounded-t-xl` porque um fundo próprio dentro de uma caixa
                arredondada quadra as quinas de cima; e `shrink-0` porque as duas
                mãos têm altura fixa: sem isso o cabeçalho cede espaço para a
                lista antes de ela rolar. */}
            <header
                className={cn(
                    "bg-card flex shrink-0 flex-col gap-2 rounded-t-xl border-b px-4 py-3",
                    // Com abas, a `TabsList` encosta na borda de baixo do
                    // cabeçalho: é a linha dela que o traço da aba ativa
                    // sublinha, e um `pb-3` deixaria o traço solto no meio
                    // da superfície.
                    abas && "pb-0",
                )}
            >
                <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h2
                            id={tituloId}
                            className="truncate text-lg font-bold tracking-tight"
                        >
                            {titulo}
                        </h2>

                        {descricao && (
                            <div className="text-muted-foreground text-xs">
                                {descricao}
                            </div>
                        )}
                    </div>

                    {acoes && <div className="shrink-0">{acoes}</div>}
                </div>

                {abas}
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
                {children}
            </div>
        </section>
    );
}

interface SetaProps {
    /** Quantos a cesta está mostrando — é esse recorte que o clique manda. */
    quantidade: number;
    /** Para onde eles vão; o rótulo acessível nomeia o grupo. */
    grupo: string;
    onIncluirTodos: () => void;
}

/**
 * A costura entre os dois lados — e o botão que despeja a cesta inteira no
 * grupo.
 *
 * Era só um tracejado com a seta do sentido, decorativo, e a inclusão em massa
 * era um botão dentro da cesta. As duas coisas diziam a mesma frase em lugares
 * diferentes: a seta apontava para onde a gente vai, e o botão fazia a gente ir
 * para lá. Agora é um gesto só — clicar a seta é executar o sentido que ela já
 * anunciava —, e a cesta ficou sem um botão a menos entre o filtro e a lista.
 *
 * É o atalho do recorte: filtrar já é escolher quem entra, e depois disso clicar
 * um por um é refazer à mão o que o filtro fez. Por isso o clique vale sobre o
 * que está à vista, e o rótulo diz quantos são.
 *
 * Verde e no centro da coluna. Verde porque virou ação, que é justamente o que
 * `DESIGN.md` reserva para a cor; no centro porque o eixo entre as duas mãos é o
 * meio da bancada, e um botão preso ao topo parecia enfeite do cabeçalho.
 *
 * Some abaixo do `lg`, onde os dois lados viram uma pilha e a seta apontaria
 * para o lado errado — ali a inclusão continua sendo cartão a cartão. Acima
 * dele, é a grade que lhe dá altura (`items-stretch`), a mesma das duas mãos:
 * o tracejado acompanha a bancada sem precisar saber quanto ela mede.
 */
export function SetaDaBancada({
    quantidade,
    grupo,
    onIncluirTodos,
}: SetaProps) {
    const vazia = quantidade === 0;
    const rotulo = vazia
        ? "Não há ninguém na lista para incluir no grupo"
        : `Incluir ${contagemIntegrantes(quantidade)} no grupo ${grupo}`;

    return (
        <div className="hidden lg:order-2 lg:flex lg:flex-col lg:items-center">
            <span
                aria-hidden="true"
                className="border-border/70 min-h-0 flex-1 border-l border-dashed"
            />

            <button
                type="button"
                onClick={onIncluirTodos}
                disabled={vazia}
                aria-label={rotulo}
                title={rotulo}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-xs transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
            >
                <ArrowRightIcon aria-hidden="true" size={16} weight="bold" />
            </button>

            <span
                aria-hidden="true"
                className="border-border/70 min-h-0 flex-1 border-l border-dashed"
            />
        </div>
    );
}
