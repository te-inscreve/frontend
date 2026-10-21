import { useEffect } from "react";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCSSVariable } from "uniwind";

import { queryClient } from "~/utils/api";
import { useSession } from "~/utils/auth";

import "../styles.css";

// A splash cobre a primeira leitura da sessão: sem ela, quem já entrou veria o
// login piscar antes de o guard mandá-lo para o app.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const background = useCSSVariable("--background") as string | undefined;
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (!isPending) void SplashScreen.hideAsync();
    }, [isPending]);

    return (
        <QueryClientProvider client={queryClient}>
            <Stack
                screenOptions={{
                    contentStyle: { backgroundColor: background },
                }}
            >
                {/*
                 * O guard decide a rota pela sessão: entrar ou sair muda o
                 * `useSession`, e o expo-router leva para a primeira tela
                 * liberada. Por isso o login e o logout não navegam.
                 */}
                <Stack.Protected guard={!!session}>
                    <Stack.Screen name="index" />
                </Stack.Protected>
                <Stack.Protected guard={!session}>
                    <Stack.Screen
                        name="login"
                        options={{ headerShown: false }}
                    />
                </Stack.Protected>
            </Stack>
            <StatusBar />
        </QueryClientProvider>
    );
}
