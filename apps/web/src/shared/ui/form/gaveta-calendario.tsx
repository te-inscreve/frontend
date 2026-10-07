"use client";

import type { Transition } from "motion/react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import { Button } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

/**
 * A gaveta do calendário desce e sobe pela altura. Mola sem quique: a gaveta
 * empurra o resto do formulário, e um quique faria a página inteira balançar.
 */
const TRANSICAO_GAVETA: Transition = {
    type: "spring",
    bounce: 0,
    duration: 0.3,
};

interface Props {
    /** `id` do gatilho — é a ele que um `<label for>` aponta. */
    id: string;
    aberto: boolean;
    onAbertoChange: (aberto: boolean) => void;
    /** O gatilho, para quem escolhe a data devolver o foco a ele. */
    gatilhoRef: React.RefObject<HTMLButtonElement | null>;
    icone: React.ReactNode;
    /** O que está escolhido, por extenso, ou o convite a escolher. */
    resumo: React.ReactNode;
    /** Sem escolha: o resumo sai apagado. */
    vazio: boolean;
    invalido?: boolean;
    "aria-labelledby"?: string;
    /** Rótulo do ✕. Sem `onLimpar`, o ✕ não aparece. */
    rotuloLimpar?: string;
    onLimpar?: () => void;
    /** O calendário, montado só enquanto a gaveta está aberta. */
    children: React.ReactNode;
    /** O que fica à vista com a gaveta fechada, abaixo dela. */
    rodape?: React.ReactNode;
    className?: string;
}

/**
 * Caixa de campo de data: uma linha com a escolha por extenso que, clicada,
 * desce o calendário logo abaixo, no próprio fluxo do formulário.
 *
 * Gaveta, e não popover: os formulários de data vivem em diálogos e em abas, e
 * popover sobre modal empilhava duas camadas para uma escolha só. Fechada, a
 * caixa ocupa uma linha, e dois ou três campos de data deixam de empurrar o
 * resto do formulário para fora da tela. Quem decide quando a escolha terminou
 * — e a gaveta sobe — é o campo, pelo `onAbertoChange`.
 */
export function GavetaCalendario({
    id,
    aberto,
    onAbertoChange,
    gatilhoRef,
    icone,
    resumo,
    vazio,
    invalido,
    "aria-labelledby": ariaLabelledBy,
    rotuloLimpar = "Limpar",
    onLimpar,
    children,
    rodape,
    className,
}: Props) {
    const idConteudo = `${id}-calendario`;

    return (
        <div
            className={cn(
                "bg-card group-data-[invalid=true]/field:border-destructive flex flex-col overflow-hidden rounded-lg border",
                className,
            )}
        >
            {/* O botão de limpar é irmão, e não filho, do gatilho — botão
                dentro de botão não é HTML válido —, e por isso se posiciona
                por cima dele, ao lado da seta, em vez de entrar no fluxo. */}
            <div className="relative flex min-h-11 items-center">
                <button
                    ref={gatilhoRef}
                    id={id}
                    type="button"
                    aria-expanded={aberto}
                    aria-controls={idConteudo}
                    aria-labelledby={ariaLabelledBy}
                    aria-invalid={invalido}
                    onClick={() => onAbertoChange(!aberto)}
                    className="focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left outline-none hover:cursor-pointer focus-visible:ring-[3px] focus-visible:ring-inset"
                >
                    <span
                        aria-hidden="true"
                        className="text-primary flex shrink-0 items-center"
                    >
                        {icone}
                    </span>
                    <span
                        className={cn(
                            "truncate text-sm font-medium",
                            vazio && "text-muted-foreground font-normal",
                        )}
                    >
                        {resumo}
                    </span>
                    {/* Reserva o lugar do botão de limpar, para que o resumo
                        trunque antes de passar por baixo dele. */}
                    {onLimpar && (
                        <span aria-hidden="true" className="size-6 shrink-0" />
                    )}
                    <CaretDownIcon
                        aria-hidden="true"
                        className={cn(
                            "text-muted-foreground ml-auto shrink-0 transition-transform duration-200",
                            aberto && "rotate-180",
                        )}
                    />
                </button>
                {onLimpar && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={rotuloLimpar}
                        title={rotuloLimpar}
                        // Encostado à seta: o `px-3` do gatilho, a seta de
                        // 16px e o `gap-2` somam os 36px do `right-9`.
                        className="text-muted-foreground hover:bg-destructive-foreground hover:text-destructive absolute top-1/2 right-9 -translate-y-1/2"
                        onClick={() => {
                            onLimpar();
                            // O botão some junto com a escolha; sem isto o
                            // foco cairia no `body`.
                            gatilhoRef.current?.focus();
                        }}
                    >
                        <XIcon aria-hidden="true" />
                    </Button>
                )}
            </div>

            <MotionConfig reducedMotion="user">
                <AnimatePresence initial={false}>
                    {aberto && (
                        <motion.div
                            key="calendario"
                            id={idConteudo}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={TRANSICAO_GAVETA}
                            // O corte esconde a grade enquanto a altura passa
                            // por valores menores que ela.
                            className="overflow-hidden border-t"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </MotionConfig>

            {rodape}
        </div>
    );
}
