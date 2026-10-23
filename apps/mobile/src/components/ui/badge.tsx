import type { VariantProps } from "class-variance-authority";
import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import type { ViewProps } from "react-native";
import { Text, View } from "react-native";
import { cva } from "class-variance-authority";

import { cn } from "~/utils/cn";

/*
 * As variantes do `Badge` do web, sem os estados de hover e foco: o selo do
 * mobile não é tocável. `self-start` faz o papel do `w-fit` do web, para o
 * selo não esticar na largura de uma coluna.
 */
const badgeVariants = cva(
    "shrink-0 flex-row items-center justify-center gap-1 self-start overflow-hidden rounded-sm border border-transparent px-2 py-0.5",
    {
        variants: {
            variant: {
                default: "bg-primary",
                secondary: "bg-secondary",
                destructive: "bg-destructive dark:bg-destructive/60",
                "primary-outline": "bg-card border-primary/40",
                outline: "border-border",
                ghost: "",
                link: "",
                warning: "bg-warning/10",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

/*
 * No React Native o `Text` não herda a cor da `View`, e no Uniwind gratuito
 * `group-*` não tem efeito: a cor do texto e a do ícone saem da mesma
 * variante, cada uma no seu elemento.
 */
const badgeTextVariants = cva("text-xs", {
    variants: {
        variant: {
            default: "text-primary-foreground font-semibold",
            secondary: "text-secondary-foreground",
            destructive: "font-semibold text-white",
            "primary-outline": "text-primary",
            outline: "text-foreground",
            ghost: "text-foreground",
            link: "text-primary",
            warning: "text-warning font-semibold",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

const badgeIconVariants = cva("", {
    variants: {
        variant: {
            default: "accent-primary-foreground",
            secondary: "accent-secondary-foreground",
            destructive: "accent-white",
            "primary-outline": "accent-primary",
            outline: "accent-foreground",
            ghost: "accent-foreground",
            link: "accent-primary",
            warning: "accent-warning",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

type BadgeProps = Omit<ViewProps, "children"> &
    VariantProps<typeof badgeVariants> & {
        className?: string;
        textClassName?: string;
        /** Ícone Phosphor já passado por `withUniwind`, para aceitar a cor por classe. */
        icone?: ComponentType<IconProps & { colorClassName?: string }>;
        iconeClassName?: string;
        iconePeso?: IconProps["weight"];
        children: string;
    };

function Badge({
    className,
    textClassName,
    variant = "default",
    icone: Icone,
    iconeClassName,
    iconePeso,
    children,
    ...props
}: BadgeProps) {
    return (
        <View className={cn(badgeVariants({ variant }), className)} {...props}>
            {Icone && (
                <Icone
                    // O `[&>svg]:size-3` do web.
                    size={12}
                    weight={iconePeso}
                    colorClassName={cn(
                        badgeIconVariants({ variant }),
                        iconeClassName,
                    )}
                    aria-hidden
                />
            )}
            <Text className={cn(badgeTextVariants({ variant }), textClassName)}>
                {children}
            </Text>
        </View>
    );
}

export { Badge, badgeIconVariants, badgeTextVariants, badgeVariants };
export type { BadgeProps };
