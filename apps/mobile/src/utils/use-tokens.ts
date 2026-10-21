import type { Theme } from "expo-router";
import { useMemo } from "react";
import { DarkTheme, DefaultTheme } from "expo-router";
import { useCSSVariable, useUniwind } from "uniwind";

/**
 * Os tokens do `theme.css` para o que não aceita `className`: o cabeçalho da
 * navegação e os controles do Expo UI (ADR 0001). É o único lugar que lê cor
 * por variável CSS; o resto do app usa classes do Uniwind.
 *
 * Os valores trocam junto com o tema do sistema, porque o `useCSSVariable`
 * reage à mudança.
 */
export function useTokens() {
    const [background, foreground, card, border, primary] = useCSSVariable([
        "--background",
        "--foreground",
        "--card",
        "--border",
        "--primary",
    ]).map((valor) => (valor === undefined ? undefined : String(valor)));
    const { theme } = useUniwind();

    return {
        escuro: theme === "dark",
        background,
        foreground,
        card,
        border,
        primary,
    };
}

/**
 * O tema do React Navigation montado dos tokens: cabeçalho, fundo das telas
 * e bordas saem do mesmo `theme.css` do web, no claro e no escuro.
 */
export function useTemaNavegacao(): Theme {
    const { escuro, primary, background, card, foreground, border } =
        useTokens();

    // Um objeto novo a cada render faria o `ThemeProvider` re-renderizar
    // todos os navegadores abaixo dele.
    return useMemo(() => {
        const base = escuro ? DarkTheme : DefaultTheme;

        return {
            ...base,
            colors: {
                ...base.colors,
                primary: primary ?? base.colors.primary,
                background: background ?? base.colors.background,
                card: card ?? base.colors.card,
                text: foreground ?? base.colors.text,
                border: border ?? base.colors.border,
            },
        };
    }, [escuro, primary, background, card, foreground, border]);
}
