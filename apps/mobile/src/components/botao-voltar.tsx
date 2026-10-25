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
 * O que ele faz fica com quem o usa: em geral, o da pilha
 * ({@link opcoesComVoltar}); numa tela que sai para outro lugar,
 * {@link opcoesComVoltarPara}.
 */
function BotaoVoltar({ aoVoltar }: { aoVoltar: () => void }) {
    return (
        <Pressable
            role="button"
            onPress={aoVoltar}
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
 * Volta na pilha. Sem tela atrás, como ao recarregar o app com ela aberta, o
 * `back` sairia da aba; aí leva a `semHistorico`, a entrada da aba.
 */
function VoltarNaPilha({
    podeVoltar,
    semHistorico,
}: {
    podeVoltar: boolean;
    semHistorico: Href;
}) {
    const router = useRouter();
    return (
        <BotaoVoltar
            aoVoltar={() =>
                podeVoltar ? router.back() : router.replace(semHistorico)
            }
        />
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
            <VoltarNaPilha
                podeVoltar={canGoBack ?? false}
                semHistorico={semHistorico}
            />
        ),
    };
}

/** Como {@link opcoesComVoltar}, mas o "Voltar" faz `aoVoltar`. */
export function opcoesComVoltarPara(aoVoltar: () => void) {
    return {
        headerTitle: "",
        headerBackVisible: false,
        headerLeft: () => <BotaoVoltar aoVoltar={aoVoltar} />,
    };
}
