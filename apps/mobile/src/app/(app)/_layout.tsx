import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { ClipboardTextIcon } from "phosphor-react-native/src/icons/ClipboardText";
import { GearSixIcon } from "phosphor-react-native/src/icons/GearSix";
import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { withUniwind } from "uniwind";

import { TabBar, TabBarButton } from "~/components/tab-bar";

const IconeCategorias = withUniwind(SquaresFourIcon);
const IconeAvaliacoes = withUniwind(ClipboardTextIcon);
const IconeConfiguracoes = withUniwind(GearSixIcon);

/**
 * As três abas do avaliador. Cada aba é uma pilha própria (`<aba>/_layout`),
 * então categoria → detalhe empilha dentro de Categorias sem esconder a barra.
 */
export default function AppLayout() {
    return (
        <Tabs style={{ flex: 1 }}>
            <TabSlot />
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
