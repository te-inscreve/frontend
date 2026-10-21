"use client";

import * as React from "react";
import { createContext, useContext, useRef } from "react";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { motion } from "motion/react";

import { Button, cn } from "@te-inscreve/components";

import { useHorizontalScroll } from "~/shared/utils/use-horizontal-scroll";

/** Largura do esmaecimento em cada ponta. Acompanha a folga das setas laterais. */
const BORDA_ESMAECIDA = "3rem";

interface Contexto {
    scrollDivRef: React.RefObject<HTMLDivElement | null>;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    voltar: () => void;
    avancar: () => void;
}

const HorizontalScrollContexto = createContext<Contexto | null>(null);

function useHorizontalScrollContexto(componente: string) {
    const contexto = useContext(HorizontalScrollContexto);
    if (!contexto) {
        throw new Error(
            `${componente} precisa estar dentro de HorizontalScroll.`,
        );
    }
    return contexto;
}

/**
 * Rolagem horizontal em peças: a raiz guarda o estado, a
 * {@link HorizontalScrollViewport} é a faixa que rola, e
 * {@link HorizontalScrollPrevious}/{@link HorizontalScrollNext} são as setas,
 * que vão onde quem compõe quiser — nas laterais, num cabeçalho, ou em lugar
 * nenhum.
 *
 * ```tsx
 * <HorizontalScroll>
 *     <HorizontalScrollPrevious lateral />
 *     <HorizontalScrollNext lateral />
 *     <HorizontalScrollViewport label="Categorias de Danças">
 *         {cartoes}
 *     </HorizontalScrollViewport>
 * </HorizontalScroll>
 * ```
 *
 * É agnóstica de conteúdo: o item decide a própria largura; as peças só cuidam
 * da rolagem.
 */
export function HorizontalScroll({
    children,
    scrollStep,
    className,
}: {
    children: React.ReactNode;
    /**
     * Quanto as setas rolam por clique, em pixels. Por padrão quase uma tela
     * cheia, o que mantém um item visível como referência do que já foi visto.
     */
    scrollStep?: number;
    /** A raiz é `relative`: as setas `lateral` se posicionam por ela. */
    className?: string;
}) {
    const scrollDivRef = useRef<HTMLDivElement>(null);
    const {
        canScrollLeft,
        canScrollRight,
        // O hook nomeia pela propriedade `scrollLeft` do elemento, não pela
        // direção: `scrollLeft()` aumenta o scroll (avança para a direita) e
        // `scrollRight()` diminui (volta para a esquerda).
        scrollLeft: avancarPor,
        scrollRight: voltarPor,
    } = useHorizontalScroll({ scrollDivRef });

    /** Uma "tela" de rolagem, deixando um item à vista como referência. */
    const passo = () =>
        scrollStep ?? (scrollDivRef.current?.clientWidth ?? 400) * 0.8;

    return (
        <HorizontalScrollContexto
            value={{
                scrollDivRef,
                canScrollLeft,
                canScrollRight,
                voltar: () => voltarPor(passo()),
                avancar: () => avancarPor(passo()),
            }}
        >
            <div className={cn("relative", className)}>{children}</div>
        </HorizontalScrollContexto>
    );
}

/** A faixa que rola. Cada filho vira um item da lista. */
export function HorizontalScrollViewport({
    children,
    label,
    snap = true,
    className,
}: {
    children: React.ReactNode;
    /** Nome da lista para leitores de tela. Ex.: "Categorias de Danças Tradicionais". */
    label: string;
    /**
     * Encaixa a rolagem no início de cada item. Desligue para um item só
     * mais largo que a faixa (uma tabela): com um único ponto de encaixe, a
     * rolagem suave das setas volta sempre ao começo.
     */
    snap?: boolean;
    className?: string;
}) {
    const { scrollDivRef, canScrollLeft, canScrollRight } =
        useHorizontalScrollContexto("HorizontalScrollViewport");

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
                // Rolável pelo teclado: os itens não têm foco próprio, então
                // sem isso a lista ficaria inalcançável sem mouse.
                tabIndex={0}
                style={{ maskImage: mascara, WebkitMaskImage: mascara }}
                className={cn(
                    "peer flex gap-3 overflow-x-auto py-1",
                    snap && "snap-x snap-mandatory",
                    // A barra nativa sai de cena — as setas e o esmaecimento
                    // das pontas é que sinalizam que há mais conteúdo.
                    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    // O foco é desenhado pelo irmão abaixo.
                    "outline-none",
                )}
            >
                {React.Children.map(children, (item) => (
                    <div
                        role="listitem"
                        className={cn("flex shrink-0", snap && "snap-start")}
                    >
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

type SetaProps = Omit<
    React.ComponentProps<typeof Button>,
    "onClick" | "disabled" | "children"
> & {
    /**
     * Sobre a lateral da raiz, centrada na altura — o desenho clássico da fila
     * de cartões. Some abaixo de `md`, onde se rola arrastando, e some quando
     * não há para onde ir. Sem ela, a seta fica onde foi posta e só se apaga.
     */
    lateral?: boolean;
};

/** Volta uma "tela". Desabilitada no começo da faixa. */
export function HorizontalScrollPrevious(props: SetaProps) {
    const { canScrollLeft, voltar } = useHorizontalScrollContexto(
        "HorizontalScrollPrevious",
    );
    return (
        <Seta
            {...props}
            lado="esquerda"
            desabilitada={!canScrollLeft}
            onClick={voltar}
        />
    );
}

/** Avança uma "tela". Desabilitada no fim da faixa. */
export function HorizontalScrollNext(props: SetaProps) {
    const { canScrollRight, avancar } = useHorizontalScrollContexto(
        "HorizontalScrollNext",
    );
    return (
        <Seta
            {...props}
            lado="direita"
            desabilitada={!canScrollRight}
            onClick={avancar}
        />
    );
}

function Seta({
    lado,
    desabilitada,
    onClick,
    lateral = false,
    className,
    ...props
}: SetaProps & {
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
            aria-label={
                paraEsquerda ? "Ver itens anteriores" : "Ver próximos itens"
            }
            {...props}
            disabled={desabilitada}
            onClick={onClick}
            className={cn(
                "bg-background rounded-full shadow-sm",
                lateral && [
                    "absolute top-1/2 z-10 hidden -translate-y-1/2 md:flex",
                    paraEsquerda ? "left-1" : "right-1",
                    // Desabilitada some de vez: não ocupa a ordem de foco nem
                    // deixa uma seta apagada sobre o primeiro item.
                    "transition-opacity disabled:pointer-events-none disabled:opacity-0",
                ],
                className,
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
