import type { Href } from "expo-router";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { withUniwind } from "uniwind";

const IconeVoltar = withUniwind(ArrowLeftIcon);

/**
 * O "Voltar" das telas empilhadas numa aba, no lugar da seta e do título
 * nativos: o nome da tela vai para um cabeçalho dentro dela, com o resto do
 * contexto. A seta e o texto ficam onde o Android desenha os nativos — a
 * seta `bold` de 20pt tem o traço e a largura da nativa, e o texto começa
 * onde começaria o título, no peso normal.
 *
 * Sem tela atrás na pilha, como ao recarregar o app com ela aberta, o `back`
 * sairia da aba; aí o "Voltar" leva a `semHistorico`, a entrada da aba.
 */
function BotaoVoltar({
    podeVoltar,
    semHistorico,
}: {
    podeVoltar: boolean;
    semHistorico: Href;
}) {
    const router = useRouter();
    return (
        <Pressable
            role="button"
            onPress={() =>
                podeVoltar ? router.back() : router.replace(semHistorico)
            }
            className="h-12 flex-row items-center"
        >
            <IconeVoltar
                size={16}
                weight="bold"
                colorClassName="accent-primary"
                aria-hidden
            />
            <Text className="text-primary text-base" style={{ marginLeft: 8 }}>
                Voltar
            </Text>
        </Pressable>
    );
}

/**
 * As opções da pilha para uma tela com o {@link BotaoVoltar}. O `title` da
 * tela continua valendo para leitores de tela e o histórico do sistema.
 */
export function opcoesComVoltar(semHistorico: Href) {
    return {
        headerTitle: "",
        headerBackVisible: false,
        headerLeft: ({ canGoBack }: { canGoBack?: boolean }) => (
            <BotaoVoltar
                podeVoltar={canGoBack ?? false}
                semHistorico={semHistorico}
            />
        ),
    };
}
