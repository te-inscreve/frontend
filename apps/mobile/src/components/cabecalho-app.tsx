import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { SaudacaoAvaliador } from "~/features/auth/components/saudacao-avaliador";
import { IndicadorFila } from "~/features/avaliacoes/components/indicador-fila";
import { useFila } from "~/features/avaliacoes/lib/use-fila";

/**
 * O cabeçalho fixo do app logado: o avaliador à esquerda e o estado da fila à
 * direita, sobre a cor primária. O estado abre o detalhe da fila.
 *
 * Sobe até a borda da tela e empurra o conteúdo para baixo da status bar, como
 * a `TabBar` faz com o gesto de navegação embaixo.
 */
export function CabecalhoApp() {
    const { top } = useSafeAreaInsets();
    const { estado } = useFila();
    const router = useRouter();

    return (
        <View
            className="bg-primary flex-row items-center gap-3 px-4 pb-3"
            style={{ paddingTop: top + 12 }}
        >
            <SaudacaoAvaliador />
            {/* O teto de largura impede que um texto longo cubra a saudação. */}
            <View className="max-w-1/2 shrink-0 items-end">
                <IndicadorFila
                    estado={estado}
                    onPress={() => router.push("/fila")}
                />
            </View>
        </View>
    );
}
