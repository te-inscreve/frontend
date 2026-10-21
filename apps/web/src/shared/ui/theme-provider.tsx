"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * O tema claro ou escuro, escolhido em `/configuracoes`.
 *
 * `attribute="class"` porque o `dark:` do Tailwind é a classe `dark` na raiz
 * (ver `app/styles.css`). O padrão é o claro, e não o do sistema: até aqui o
 * app só existia claro, e quem nunca escolheu continua vendo o mesmo.
 * `disableTransitionOnChange` evita que cada borda e fundo animem a troca
 * no próprio ritmo.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
