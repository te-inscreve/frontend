"use client";

import type { Transition } from "motion/react";
import type * as React from "react";
import { createContext, use } from "react";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@te-inscreve/components/utils";

/**
 * A inércia de toda expansão cartão → modal do produto. Fica aqui, e não em
 * cada chamador, para os morphs da aplicação inteira terem o mesmo peso.
 */
export const EXPANSION_TRANSITION: Transition = {
    type: "spring",
    stiffness: 380,
    damping: 34,
};

/**
 * Raio do cartão fechado e do modal aberto. Em pixels, e não na classe
 * `rounded-lg`, porque o Motion precisa do número para contra-escalar as quinas
 * durante o morph — o valor acompanha o `--radius-lg` do tema.
 */
const DEFAULT_RADIUS = 12;

interface ExpandableDialogContextValue {
    /** Base dos `layoutId`. Precisa ser único entre os itens da mesma tela. */
    id: string;
    radius: number;
    open: boolean;
}

const ExpandableDialogContext =
    createContext<ExpandableDialogContextValue | null>(null);

function useExpandableDialog(componente: string) {
    const contexto = use(ExpandableDialogContext);

    if (!contexto) {
        throw new Error(
            `<${componente}> precisa estar dentro de um <ExpandableDialog>.`,
        );
    }

    return contexto;
}

/** Nomes derivados do `id`, para gatilho e conteúdo não poderem divergir. */
function layoutIds(id: string) {
    return {
        caixa: `expandable-dialog-${id}`,
        selo: `expandable-dialog-${id}-selo`,
        rotulo: `expandable-dialog-${id}-rotulo`,
    };
}

interface RootProps extends Omit<
    React.ComponentProps<typeof DialogPrimitive.Root>,
    "open" | "onOpenChange"
> {
    /**
     * Único entre os itens da mesma tela: é dele que saem os `layoutId` que
     * ligam o gatilho ao modal. Em uma lista, use algo do próprio item.
     */
    id: string;
    /** Raio do cartão fechado e do modal, em pixels. */
    radius?: number;
    /**
     * A abertura é sempre controlada: o `AnimatePresence` precisa saber quando
     * o modal saiu para poder animá-lo de volta ao cartão.
     */
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Diálogo que nasce do item que o abriu: o cartão (ou a linha) cresce até virar
 * o modal e encolhe de volta para o mesmo lugar ao fechar.
 *
 * Não é uma variante visual do `Dialog` — é outra leitura. Use quando o modal é
 * a continuação de algo já visível na tela; para confirmação, aviso ou um
 * formulário que não sai de um item, o `Dialog` comum continua sendo o certo.
 *
 * Ver `docs/animacoes.md` para o porquê de cada detalhe da montagem.
 */
function ExpandableDialog({
    id,
    radius = DEFAULT_RADIUS,
    open,
    children,
    ...props
}: RootProps) {
    return (
        <ExpandableDialogContext value={{ id, radius, open }}>
            {/* Com `prefers-reduced-motion` o Motion descarta as animações de
                transform e o modal simplesmente aparece — o resto do diálogo
                continua igual. */}
            <MotionConfig
                reducedMotion="user"
                transition={EXPANSION_TRANSITION}
            >
                <DialogPrimitive.Root
                    data-slot="expandable-dialog"
                    open={open}
                    {...props}
                >
                    {children}
                </DialogPrimitive.Root>
            </MotionConfig>
        </ExpandableDialogContext>
    );
}

/**
 * O item de onde o modal sai. É um botão de verdade e não recebe estilo nenhum
 * de fábrica: quem chama desenha o cartão, a linha ou o atalho.
 */
function ExpandableDialogTrigger({
    className,
    style,
    ...props
}: React.ComponentProps<typeof motion.button>) {
    const { id, radius } = useExpandableDialog("ExpandableDialogTrigger");

    return (
        <DialogPrimitive.Trigger asChild>
            <motion.button
                data-slot="expandable-dialog-trigger"
                type="button"
                layoutId={layoutIds(id).caixa}
                // O raio vai em `style` porque é assim que o Motion consegue
                // contra-escalá-lo durante o morph; em classe, as quinas
                // achatam no meio do caminho.
                style={{ borderRadius: radius, ...style }}
                className={cn("cursor-pointer", className)}
                {...props}
            />
        </DialogPrimitive.Trigger>
    );
}

/**
 * O selo — normalmente um ícone — que o gatilho e o modal têm em comum.
 *
 * É o que dá a leitura de "o mesmo elemento cresceu": sem um par de âncoras
 * compartilhadas, o morph vira só uma caixa mudando de tamanho.
 */
function ExpandableDialogIcon({
    className,
    ...props
}: React.ComponentProps<typeof motion.span>) {
    const { id } = useExpandableDialog("ExpandableDialogIcon");

    return (
        <motion.span
            data-slot="expandable-dialog-icon"
            layoutId={layoutIds(id).selo}
            className={cn(
                "bg-primary-foreground text-primary flex size-9 shrink-0 items-center justify-center rounded-full",
                className,
            )}
            {...props}
        />
    );
}

/**
 * O rótulo compartilhado. No gatilho é o texto do cartão; dentro do modal ele é
 * o `ExpandableDialogTitle` — o mesmo elemento, então ele viaja em vez de
 * trocar.
 */
function ExpandableDialogLabel({
    className,
    ...props
}: React.ComponentProps<typeof motion.span>) {
    const { id } = useExpandableDialog("ExpandableDialogLabel");

    return (
        <motion.span
            data-slot="expandable-dialog-label"
            layoutId={layoutIds(id).rotulo}
            className={cn("text-sm font-medium", className)}
            {...props}
        />
    );
}

/**
 * O modal em que o gatilho se transforma.
 *
 * Deliberadamente não reaproveita o `DialogContent`: aquele centraliza por
 * `translate-x/y-[-50%]` e anima com `data-[state]:zoom-in`, e as duas coisas
 * disputam o `transform` com a projeção do Motion. Aqui a centralização é do
 * grid de fora e o `transform` é só do Motion.
 */
function ExpandableDialogContent({
    className,
    style,
    children,
    showCloseButton = true,
    ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & {
    // O `children` do `motion.div` aceita `MotionValue`; aqui ele convive com o
    // botão de fechar em um fragmento, então precisa ser `ReactNode` mesmo.
    children?: React.ReactNode;
    showCloseButton?: boolean;
}) {
    const { id, radius, open } = useExpandableDialog("ExpandableDialogContent");

    return (
        // Quem monta e desmonta é o `AnimatePresence`, não o Radix: daí o
        // `forceMount` no portal e no conteúdo. Sem isso o Radix arrancaria o
        // modal da árvore no clique, antes de ele ter voltado para o cartão.
        <AnimatePresence>
            {open && (
                <DialogPrimitive.Portal forceMount>
                    <motion.div
                        data-slot="expandable-dialog-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/50"
                    />

                    {/* A camada de centralização não captura clique: o que
                        estiver fora do modal continua chegando ao overlay, que
                        é quem fecha. */}
                    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
                        <DialogPrimitive.Content asChild forceMount>
                            <motion.div
                                data-slot="expandable-dialog-content"
                                layoutId={layoutIds(id).caixa}
                                style={{ borderRadius: radius, ...style }}
                                className={cn(
                                    "bg-background pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col gap-4 overflow-y-auto border p-6 shadow-lg",
                                    className,
                                )}
                                {...props}
                            >
                                {children}

                                {showCloseButton && (
                                    <DialogPrimitive.Close
                                        data-slot="expandable-dialog-close"
                                        className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
                                    >
                                        <XIcon className="size-4" />
                                        <span className="sr-only">Fechar</span>
                                    </DialogPrimitive.Close>
                                )}
                            </motion.div>
                        </DialogPrimitive.Content>
                    </div>
                </DialogPrimitive.Portal>
            )}
        </AnimatePresence>
    );
}

function ExpandableDialogHeader({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="expandable-dialog-header"
            className={cn("flex shrink-0 flex-col gap-2 text-left", className)}
            {...props}
        />
    );
}

/** O título acessível do modal, sobre o rótulo que veio do gatilho. */
function ExpandableDialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof motion.span>) {
    return (
        <DialogPrimitive.Title asChild>
            <ExpandableDialogLabel
                className={cn("text-lg font-semibold", className)}
                {...props}
            />
        </DialogPrimitive.Title>
    );
}

/**
 * A descrição não compartilha `layoutId` — é conteúdo que só existe aberto,
 * então entra em opacidade. Esticar texto no morph custa caro e fica borrado.
 */
function ExpandableDialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof motion.p>) {
    return (
        <DialogPrimitive.Description asChild>
            <motion.p
                data-slot="expandable-dialog-description"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("text-muted-foreground text-sm", className)}
                {...props}
            />
        </DialogPrimitive.Description>
    );
}

/**
 * O miolo do modal — o que não existe no estado fechado.
 *
 * Entra em opacidade com um atraso curto, para a caixa já estar quase no
 * tamanho final: aparecer junto com o morph faz o conteúdo parecer esticado.
 */
function ExpandableDialogBody({
    className,
    ...props
}: React.ComponentProps<typeof motion.div>) {
    return (
        <motion.div
            data-slot="expandable-dialog-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className={cn("flex min-h-0 flex-col gap-4", className)}
            {...props}
        />
    );
}

function ExpandableDialogFooter({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="expandable-dialog-footer"
            className={cn(
                "flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end",
                className,
            )}
            {...props}
        />
    );
}

const ExpandableDialogClose = DialogPrimitive.Close;

export {
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogClose,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogFooter,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
};
