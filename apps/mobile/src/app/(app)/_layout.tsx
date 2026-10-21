import { StatusBar } from "react-native";
import {
    SafeAreaInsetsContext,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { ClipboardTextIcon } from "phosphor-react-native/src/icons/ClipboardText";
import { GearSixIcon } from "phosphor-react-native/src/icons/GearSix";
import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { withUniwind } from "uniwind";

import { CabecalhoApp } from "~/components/cabecalho-app";
import { TabBar, TabBarButton } from "~/components/tab-bar";
import { useTokens } from "~/utils/use-tokens";

const IconeCategorias = withUniwind(SquaresFourIcon);
const IconeAvaliacoes = withUniwind(ClipboardTextIcon);
const IconeConfiguracoes = withUniwind(GearSixIcon);

/**
 * As três abas do avaliador. Cada aba é uma pilha própria (`<aba>/_layout`),
 * então categoria → detalhe empilha dentro de Categorias sem esconder a barra.
 *
 * O `CabecalhoApp` fica fora das abas, então trocar de aba ou empilhar uma
 * tela não o monta de novo. A barra de cada pilha vem logo abaixo dele.
 */
export default function AppLayout() {
    const insets = useSafeAreaInsets();
    const { escuro } = useTokens();

    return (
        <Tabs style={{ flex: 1 }}>
            {/*
             * O `primary-foreground` é claro no tema claro e escuro no escuro;
             * os ícones da status bar o acompanham para ficarem legíveis.
             *
             * O `StatusBar` do RN, e não o do expo-status-bar, porque só ele
             * aceita `translucent`: no build o SDK 57 já é edge-to-edge e isso
             * não muda nada, mas o Expo Go no Android desenha a status bar
             * opaca, e sem `translucent` o cabeçalho ficaria abaixo dela.
             */}
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={escuro ? "dark-content" : "light-content"}
            />
            <CabecalhoApp />
            {/*
             * O cabeçalho já cobre a status bar. Sem zerar o `top`, a barra
             * de cada pilha somaria a área segura de novo e abriria um vão
             * abaixo dele.
             */}
            <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
                <TabSlot />
            </SafeAreaInsetsContext.Provider>
            <TabList asChild>
                <TabBar>
                    <TabTrigger name="categorias" href="/categorias" asChild>
                        <TabBarButton
                            icone={IconeCategorias}
                            rotulo="Categorias"
                        />
                    </TabTrigger>
                    <TabTrigger name="avaliacoes" href="/avaliacoes" asChild>
                        <TabBarButton
                            icone={IconeAvaliacoes}
                            rotulo="Avaliações"
                        />
                    </TabTrigger>
                    <TabTrigger
                        name="configuracoes"
                        href="/configuracoes"
                        asChild
                    >
                        <TabBarButton
                            icone={IconeConfiguracoes}
                            rotulo="Configurações"
                        />
                    </TabTrigger>
                </TabBar>
            </TabList>
        </Tabs>
    );
}
