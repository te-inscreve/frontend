import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import type { PressableProps } from "react-native";
import { Pressable, Text, View } from "react-native";
import { cva } from "class-variance-authority";

import { cn } from "~/utils/cn";

/*
 * As variantes do `Button` do web, com alvos de toque de pelo menos 44pt: o
 * `h-9` do web é para cursor, não para dedo. Sem o fundo que muda sob o dedo:
 * é o hover do web, interação de mouse.
 */
const buttonVariants = cva(
    "flex-row items-center justify-center gap-2 rounded-md disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary",
                destructive: "bg-destructive",
                outline: "border-border bg-card border",
                // A borda e o texto verdes do `Badge` `primary-outline`.
                "primary-outline": "border-primary/40 bg-card border",
                secondary: "bg-secondary",
                ghost: "",
                link: "",
            },
            size: {
                default: "h-12 px-4",
                sm: "h-10 px-3",
                lg: "h-14 px-6",
                icon: "size-12",
                "icon-sm": "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

/*
 * No Uniwind gratuito `group-*` não tem efeito, então a cor do texto sob
 * pressão não pode vir do pai: o estado chega aqui como variante (ADR 0001).
 */
const buttonTextVariants = cva("text-base font-semibold", {
    variants: {
        variant: {
            default: "text-primary-foreground",
            destructive: "text-white",
            outline: "text-foreground",
            "primary-outline": "text-primary",
            secondary: "text-secondary-foreground",
            ghost: "text-foreground",
            link: "text-primary",
        },
        pressed: {
            true: "",
            false: "",
        },
    },
    compoundVariants: [
        { variant: "link", pressed: true, class: "underline" },
    ],
    defaultVariants: {
        variant: "default",
        pressed: false,
    },
});

type ButtonProps = Omit<PressableProps, "children"> &
    VariantProps<typeof buttonVariants> & {
        className?: string;
        /** Ícone Phosphor (ou spinner) à esquerda do texto. */
        icone?: ReactNode;
        /** Ícone à direita do texto, para quem aponta adiante ("Próxima"). */
        iconeDepois?: ReactNode;
        /** Texto do botão; omita em botões só de ícone e passe `aria-label`. */
        children?: string;
    };

function Button({
    className,
    variant = "default",
    size = "default",
    icone,
    iconeDepois,
    children,
    ...props
}: ButtonProps) {
    return (
        <Pressable
            role="button"
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        >
            {({ pressed }) => (
                <>
                    {icone && <View aria-hidden>{icone}</View>}
                    {children && (
                        <Text
                            className={buttonTextVariants({ variant, pressed })}
                        >
                            {children}
                        </Text>
                    )}
                    {iconeDepois && <View aria-hidden>{iconeDepois}</View>}
                </>
            )}
        </Pressable>
    );
}

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };
