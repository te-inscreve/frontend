import { useEffect } from "react";
import { SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";
import { useSession } from "~/utils/auth";
import { useTemaNavegacao } from "~/utils/use-tokens";

import "../styles.css";

// A splash cobre a primeira leitura da sessão: sem ela, quem já entrou veria o
// login piscar antes de o guard mandá-lo para o app.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const tema = useTemaNavegacao();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (!isPending) void SplashScreen.hideAsync();
    }, [isPending]);

    return (
        <QueryClientProvider client={queryClient}>
            {/*
             * O tema leva os tokens a todos os navegadores: o cabeçalho de
             * cada aba e o fundo das telas seguem o claro/escuro do sistema.
             */}
            <ThemeProvider value={tema}>
                <Stack screenOptions={{ headerShown: false }}>
                    {/*
                     * O guard decide a rota pela sessão: entrar ou sair muda o
                     * `useSession`, e o expo-router leva para a primeira tela
                     * liberada. Por isso o login e o logout não navegam.
                     */}
                    <Stack.Protected guard={!!session}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(app)" />
                    </Stack.Protected>
                    <Stack.Protected guard={!session}>
                        <Stack.Screen name="login" />
                    </Stack.Protected>
                </Stack>
            </ThemeProvider>
            <StatusBar />
        </QueryClientProvider>
    );
}
