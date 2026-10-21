import type { TabTriggerSlotProps } from "expo-router/ui";
import type { IconProps } from "phosphor-react-native";
import type { ComponentType, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cva } from "class-variance-authority";

import { cn } from "~/utils/cn";

/**
 * A barra inferior do app, igual no iOS e no Android (ADR 0001). Vai dentro
 * de `<TabList asChild>`, que lhe passa os `TabTrigger`.
 *
 * Desce até a borda da tela e empurra o conteúdo para cima da área segura,
 * para o gesto de navegação do sistema não ficar sobre os botões.
 */
export function TabBar({ children }: { children: ReactNode }) {
    const { bottom } = useSafeAreaInsets();

    return (
        <View
            role="tablist"
            className="border-border bg-card flex-row border-t"
            style={{ paddingBottom: bottom }}
        >
            {children}
        </View>
    );
}

/*
 * O Uniwind gratuito não aplica `group-*`, então a cor do ícone e do rótulo
 * não vem do pai: o `isFocused` chega como variante, como o `pressed` do
 * `Button`.
 */
const tabBarIconVariants = cva("", {
    variants: {
        focused: {
            true: "accent-primary",
            false: "accent-muted-foreground",
        },
    },
});

const tabBarLabelVariants = cva("text-xs", {
    variants: {
        focused: {
            true: "text-primary font-semibold",
            false: "text-muted-foreground",
        },
    },
});

type TabBarButtonProps = TabTriggerSlotProps & {
    className?: string;
    /** Ícone Phosphor já passado por `withUniwind`, para aceitar a cor por classe. */
    icone: ComponentType<IconProps & { colorClassName?: string }>;
    rotulo: string;
};

/**
 * Um item da barra. Vai dentro de `<TabTrigger asChild>`, que lhe passa o
 * `isFocused` e o `onPress`.
 */
export function TabBarButton({
    icone: Icone,
    rotulo,
    isFocused = false,
    // Só o react-native-web usa o `href`; no nativo o `onPress` já navega.
    href: _href,
    className,
    ...props
}: TabBarButtonProps) {
    return (
        <Pressable
            {...props}
            role="tab"
            aria-selected={isFocused}
            aria-label={rotulo}
            className={cn("active:bg-accent flex-1", className)}
        >
            {/*
             * O `TabTrigger asChild` injeta `flexDirection: "row"` no `style`
             * do botão, que vence a classe; a coluna fica num filho.
             */}
            <View className="h-16 flex-1 items-center justify-center gap-1">
                <Icone
                    size={24}
                    weight={isFocused ? "fill" : "regular"}
                    colorClassName={tabBarIconVariants({ focused: isFocused })}
                />
                <Text className={tabBarLabelVariants({ focused: isFocused })}>
                    {rotulo}
                </Text>
            </View>
        </Pressable>
    );
}
