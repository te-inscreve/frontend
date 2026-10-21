import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";
import { cva } from "class-variance-authority";

import { cn } from "~/utils/cn";

/*
 * As cores do `Switch` do web. O estado chega como variante em vez de
 * `data-[state=…]`, e o polegar não lê o estado do trilho porque o Uniwind
 * gratuito não aplica `group-*` (ADR 0001).
 */
const switchVariants = cva(
    "h-7 w-12 flex-row items-center rounded-full border border-transparent px-0.5",
    {
        variants: {
            ligado: {
                true: "bg-primary justify-end",
                false: "bg-input dark:bg-input/80 justify-start",
            },
        },
    },
);

const switchThumbVariants = cva("size-6 rounded-full", {
    variants: {
        ligado: {
            true: "bg-background dark:bg-primary-foreground",
            false: "bg-background dark:bg-foreground",
        },
    },
});

type SwitchProps = Omit<PressableProps, "children" | "onPress"> & {
    className?: string;
    ligado: boolean;
    aoAlternar: (ligado: boolean) => void;
};

/**
 * Interruptor liga/desliga com o visual do web. O trilho é maior que o do web
 * e o `hitSlop` completa os 44pt de alvo de toque; o nome acessível vem por
 * `aria-label` ou `aria-labelledby`.
 */
function Switch({
    className,
    ligado,
    aoAlternar,
    disabled,
    ...props
}: SwitchProps) {
    return (
        <Pressable
            role="switch"
            aria-checked={ligado}
            aria-disabled={disabled ?? undefined}
            disabled={disabled}
            hitSlop={8}
            onPress={() => aoAlternar(!ligado)}
            className={cn(
                switchVariants({ ligado }),
                disabled && "opacity-50",
                className,
            )}
            {...props}
        >
            <View className={switchThumbVariants({ ligado })} />
        </Pressable>
    );
}

export { Switch, switchVariants };
export type { SwitchProps };
