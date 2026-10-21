import { useEffect } from "react";
import { SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";
import { useSession } from "~/utils/auth";
import { aplicarTemaSalvo } from "~/utils/tema";
import { useTemaNavegacao } from "~/utils/use-tokens";

import "../styles.css";

// Antes de qualquer render, e depois do `styles.css`, que registra os temas no
// Uniwind: a primeira pintura já sai no tema escolhido.
aplicarTemaSalvo();

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
             * Antes do navegador de propósito: o RN aplica o último
             * `StatusBar` montado, e o React monta os irmãos em ordem. Assim a
             * do app logado, que acompanha o cabeçalho verde, sempre vence
             * esta, que só vale para o login e a splash.
             */}
            <StatusBar />
            {/*
             * O tema leva os tokens a todos os navegadores: o cabeçalho de
             * cada aba e o fundo das telas seguem o tema em vigor, o do sistema
             * ou o escolhido em Configurações.
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
        </QueryClientProvider>
    );
}
