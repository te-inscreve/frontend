import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { SaudacaoAvaliador } from "~/features/auth/components/saudacao-avaliador";
import { Dock } from "~/features/avaliacoes/components/dock";
import { useAvaliacaoAtual } from "~/features/avaliacoes/lib/avaliacoes-locais";
import { rotaDaAvaliacaoLocal } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import { useFila } from "~/features/avaliacoes/lib/use-fila";
import { useSession } from "~/utils/auth";

/**
 * O cabeçalho fixo do app logado: o avaliador à esquerda e a dock à direita,
 * sobre a cor primária. A dock leva à avaliação atual e ao detalhe da fila.
 *
 * Sobe até a borda da tela e empurra o conteúdo para baixo da status bar, como
 * a `TabBar` faz com o gesto de navegação embaixo.
 */
export function CabecalhoApp() {
    const { top } = useSafeAreaInsets();
    const { data: sessao } = useSession();
    const avaliacaoAtual = useAvaliacaoAtual(sessao?.user.id ?? "");
    const fila = useFila();
    const router = useRouter();

    return (
        <View
            className="bg-primary flex-row items-center gap-3 px-4 pb-3"
            style={{ paddingTop: top + 12 }}
        >
            <SaudacaoAvaliador />
            {/* O teto de largura impede que um texto longo cubra a saudação. */}
            <View className="max-w-1/2 shrink-0 items-end">
                <Dock
                    avaliacaoAtual={avaliacaoAtual}
                    fila={fila}
                    // `navigate`, e não `push`: já na ficha dela, não empilha
                    // a mesma tela de novo.
                    aoAbrirAvaliacaoAtual={(avaliacao) =>
                        router.navigate(rotaDaAvaliacaoLocal(avaliacao))
                    }
                    aoAbrirFila={() => router.push("/fila")}
                />
            </View>
        </View>
    );
}
