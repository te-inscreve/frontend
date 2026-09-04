"use client";

import * as React from "react";
import { useRef } from "react";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { motion } from "motion/react";

import { Button, cn } from "@te-inscreve/components";

import { useHorizontalScroll } from "~/shared/utils/use-horizontal-scroll";

/** Largura do esmaecimento em cada ponta. Acompanha a folga das setas. */
const BORDA_ESMAECIDA = "3rem";

interface Props {
    /**
     * Os cartões da lista. Cada filho vira um item da lista — o componente
     * cuida do embrulho e da semântica.
     */
    children: React.ReactNode;
    /** Nome da lista para leitores de tela. Ex.: "Categorias de Danças Tradicionais". */
    label: string;
    /** O que mostrar quando não há nenhum item. */
    emptyState?: React.ReactNode;
    /**
     * Quanto rolar por clique, em pixels. Por padrão rola quase uma tela cheia,
     * o que mantém um cartão visível como referência do que já foi visto.
     */
    scrollStep?: number;
    className?: string;
}

/**
 * Lista horizontal rolável de cartões, com setas, sombreado nas bordas e scroll
 * por arrasto/teclado.
 *
 * É agnóstica de conteúdo: serve para categorias, eventos, inscrições ou
 * qualquer cartão de largura fixa. O cartão decide a própria largura; a lista
 * só cuida da rolagem.
 */
export function HorizontalScrollList({
    children,
    label,
    emptyState,
    scrollStep,
    className,
}: Props) {
    const scrollDivRef = useRef<HTMLDivElement>(null);
    const {
        canScrollLeft,
        canScrollRight,
        // O hook nomeia pela propriedade `scrollLeft` do elemento, não pela
        // direção: `scrollLeft()` aumenta o scroll (avança para a direita) e
        // `scrollRight()` diminui (volta para a esquerda).
        scrollLeft: avancar,
        scrollRight: voltar,
    } = useHorizontalScroll({ scrollDivRef });

    if (React.Children.count(children) === 0) return <>{emptyState}</>;

    /** Uma "tela" de rolagem, deixando um cartão à vista como referência. */
    const passo = () =>
        scrollStep ?? (scrollDivRef.current?.clientWidth ?? 400) * 0.8;

    /**
     * Esmaece as pontas indicando que a lista continua.
     *
     * É máscara no próprio conteúdo, e não um degradê por cima: sobreposição
     * opaca precisaria adivinhar a cor do fundo e ainda cobriria o que estiver
     * embaixo — inclusive o anel de foco, cujos cantos arredondados apareciam
     * cortados.
     */
    const opaco = "rgb(0 0 0 / 1)";
    const transparente = "rgb(0 0 0 / 0)";
    const mascara = [
        `linear-gradient(to right, ${transparente} 0`,
        `${opaco} ${canScrollLeft ? BORDA_ESMAECIDA : "0px"}`,
        `${opaco} calc(100% - ${canScrollRight ? BORDA_ESMAECIDA : "0px"})`,
        `${transparente} 100%)`,
    ].join(", ");

    return (
        <div className={cn("relative", className)}>
            <SetaDeRolagem
                lado="esquerda"
                desabilitada={!canScrollLeft}
                onClick={() => voltar(passo())}
            />
            <SetaDeRolagem
                lado="direita"
                desabilitada={!canScrollRight}
                onClick={() => avancar(passo())}
            />

            {/* `div` com `role="list"` em vez de `<ul>`: o hook tipa a ref como
                `HTMLDivElement`, e forçar o tipo aqui esconderia erro de
                verdade mais tarde. Para o leitor de tela, dá na mesma. */}
            <motion.div
                ref={scrollDivRef}
                // `layoutScroll` avisa o Motion de que este ancestral rola: sem
                // ele, um cartão daqui que vira modal (`ExpandableDialog`)
                // nasceria deslocado no eixo X assim que a fila fosse rolada.
                layoutScroll
                role="list"
                aria-label={label}
                // Rolável pelo teclado: os cartões não têm foco próprio, então
                // sem isso a lista ficaria inalcançável sem mouse.
                tabIndex={0}
                style={{ maskImage: mascara, WebkitMaskImage: mascara }}
                className={cn(
                    "peer flex snap-x snap-mandatory gap-3 overflow-x-auto py-1",
                    // A barra nativa sai de cena — as setas e o esmaecimento
                    // das pontas é que sinalizam que há mais conteúdo.
                    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    // O foco é desenhado pelo irmão abaixo.
                    "outline-none",
                )}
            >
                {React.Children.map(children, (item) => (
                    <div role="listitem" className="flex shrink-0 snap-start">
                        {item}
                    </div>
                ))}
            </motion.div>

            {/* Anel de foco em um irmão, e não no elemento rolável: ali a
                máscara o recortaria junto com o conteúdo. Só desenha a linha —
                sem fundo e sem captar clique, então não cobre nada. */}
            <div
                aria-hidden="true"
                className="ring-ring pointer-events-none absolute -inset-0.5 rounded-lg opacity-0 ring-2 transition-opacity peer-focus-visible:opacity-100"
            />
        </div>
    );
}

function SetaDeRolagem({
    lado,
    desabilitada,
    onClick,
}: {
    lado: "esquerda" | "direita";
    desabilitada: boolean;
    onClick: () => void;
}) {
    const paraEsquerda = lado === "esquerda";

    return (
        <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={desabilitada}
            onClick={onClick}
            aria-label={
                paraEsquerda ? "Ver itens anteriores" : "Ver próximos itens"
            }
            className={cn(
                "bg-background absolute top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-sm md:flex",
                paraEsquerda ? "left-1" : "right-1",
                // Desabilitado some de vez: não ocupa a ordem de foco nem
                // deixa uma seta apagada sobre o primeiro cartão.
                "transition-opacity disabled:pointer-events-none disabled:opacity-0",
            )}
        >
            {paraEsquerda ? (
                <CaretLeftIcon size={16} aria-hidden="true" />
            ) : (
                <CaretRightIcon size={16} aria-hidden="true" />
            )}
        </Button>
    );
}
