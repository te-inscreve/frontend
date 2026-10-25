import { useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { useBancoLocal } from "~/db/cliente";
import { queryClient } from "~/utils/api";
import { useSession } from "~/utils/auth";
import { aplicarTemaSalvo } from "~/utils/tema";
import { useTemaNavegacao } from "~/utils/use-tokens";

import "../styles.css";

// Antes de qualquer render, e depois do `styles.css`, que registra os temas no
// Uniwind: a primeira pintura já sai no tema escolhido.
aplicarTemaSalvo();

// A splash cobre a primeira leitura da sessão e as migrações do banco local:
// sem ela, quem já entrou veria o login piscar antes de o guard mandá-lo para
// o app.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const tema = useTemaNavegacao();
    const { data: session, isPending } = useSession();
    const banco = useBancoLocal();
    const bancoResolvido = banco.success || !!banco.error;

    useEffect(() => {
        if (!isPending && bancoResolvido) void SplashScreen.hideAsync();
    }, [isPending, bancoResolvido]);

    // Sem o banco, nada do que o avaliador fez no aparelho se lê nem se
    // grava: o app para aqui em vez de seguir pela metade.
    if (banco.error)
        return (
            <View className="bg-background flex-1 items-center justify-center gap-2 p-6">
                <Text className="text-foreground text-center text-lg font-semibold">
                    Não foi possível abrir os dados do aparelho
                </Text>
                <Text className="text-muted-foreground text-center">
                    Feche e abra o app de novo. Se continuar, chame a
                    organização: as avaliações salvas continuam no aparelho.
                </Text>
            </View>
        );
    if (!banco.success) return null;

    return (
        // Os gestos do Gesture Handler, como o deslize entre as abas da ficha,
        // só reconhecem toques abaixo desta raiz.
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                            {/*
                             * A folha nativa cuida do fundo escurecido, de
                             * arrastar e de tocar fora para fechar. Aqui, e não
                             * dentro de `(app)`, para cobrir as abas também.
                             */}
                            <Stack.Screen
                                name="fila"
                                options={{
                                    presentation: "formSheet",
                                    sheetAllowedDetents: "fitToContents",
                                    sheetCornerRadius: 24,
                                    sheetGrabberVisible: true,
                                }}
                            />
                        </Stack.Protected>
                        <Stack.Protected guard={!session}>
                            <Stack.Screen name="login" />
                        </Stack.Protected>
                    </Stack>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
