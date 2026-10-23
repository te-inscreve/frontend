import type { Control } from "react-hook-form";
import { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { withUniwind } from "uniwind";

import type { TrechoFicha, ValoresFicha } from "../lib/formulario-ficha-mock";
import { Button } from "~/components/ui/button";
import { FieldGroup } from "~/components/ui/field";
import { CampoFichaControlado } from "./campo-ficha";

const IconeAplicar = withUniwind(CheckIcon);
const IconeCancelar = withUniwind(XIcon);

const DURACAO = 250;
// A desaceleração padrão do Material: a folha chega rápido e assenta devagar.
const CURVA = Easing.bezier(0.2, 0, 0, 1);
// Soltar a folha depois de descer um terço dela, ou com um puxão, fecha.
const FRACAO_PARA_FECHAR = 1 / 3;
const VELOCIDADE_PARA_FECHAR = 1000;

/**
 * MOCK (TE-82): a folha inferior onde se preenche uma ocorrência de
 * agrupamento, com todos os campos dela. "Aplicar" chama `aoAplicar`, que
 * decide se a folha fecha; arrastar a alça para baixo, o fundo e o voltar do
 * sistema chamam `aoFechar`, que fecha sempre e guarda o que foi preenchido.
 * "Cancelar" chama `aoCancelar`, que desfaz o que foi mexido na folha antes de
 * fechar.
 *
 * É um `Modal` do RN desenhado como a folha do detalhe da fila (cantos de 24,
 * alça, fundo escurecido), não uma `formSheet` nem o `BottomSheet` do Expo UI
 * (ADR 0001). O `Modal` aparece sem animação e a folha desliza por conta
 * própria, para o fundo esmaecer em vez de subir junto; ao fechar, ele só some
 * depois que ela termina de descer.
 */
export function EdicaoTrecho({
    trecho,
    visivel,
    control,
    revalidar,
    aoAplicar,
    aoFechar,
    aoCancelar,
}: {
    trecho: TrechoFicha | undefined;
    visivel: boolean;
    control: Control<ValoresFicha>;
    revalidar: (chave: string) => Promise<boolean>;
    aoAplicar: () => void;
    aoFechar: () => void;
    aoCancelar: () => void;
}) {
    const { top } = useSafeAreaInsets();
    const { height: alturaJanela } = useWindowDimensions();
    const aberta = visivel && !!trecho;
    // Fechada, a folha segue montada até terminar de descer.
    const [montada, setMontada] = useState(aberta);
    if (aberta && !montada) setMontada(true);
    // Quanto a folha está abaixo de onde assenta; a altura da janela a deixa
    // inteira fora da tela.
    const deslocamento = useSharedValue(alturaJanela);
    const alturaFolha = useSharedValue(alturaJanela);
    useEffect(() => {
        if (aberta) {
            deslocamento.set(
                withTiming(0, {
                    duration: DURACAO,
                    easing: CURVA,
                }),
            );
        } else {
            deslocamento.set(
                withTiming(
                    alturaJanela,
                    { duration: DURACAO, easing: CURVA },
                    (terminou) => {
                        if (terminou) scheduleOnRN(setMontada, false);
                    },
                ),
            );
        }
    }, [aberta, alturaJanela, deslocamento]);

    const arrastar = Gesture.Pan()
        .onUpdate(({ translationY }) => {
            deslocamento.set(Math.max(0, translationY));
        })
        .onEnd(({ translationY, velocityY }) => {
            if (
                translationY > alturaFolha.get() * FRACAO_PARA_FECHAR ||
                velocityY > VELOCIDADE_PARA_FECHAR
            ) {
                scheduleOnRN(aoFechar);
            } else {
                deslocamento.set(
                    withTiming(0, {
                        duration: DURACAO,
                        easing: CURVA,
                    }),
                );
            }
        });

    // O fundo clareia na mesma medida em que a folha desce, também no arrastar.
    const estiloFundo = useAnimatedStyle(() => ({
        opacity: interpolate(
            deslocamento.get(),
            [0, alturaFolha.get()],
            [1, 0],
            "clamp",
        ),
    }));
    const estiloFolha = useAnimatedStyle(() => ({
        transform: [{ translateY: deslocamento.get() }],
    }));

    return (
        <Modal
            visible={montada}
            transparent
            animationType="none"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={aoFechar}
        >
            {/* O `Modal` é outra raiz nativa: o gesto da alça precisa da sua, e
                as insets também. A janela principal termina acima da barra de
                tarefas do Samsung e mede 0 embaixo; a do `Modal` passa por
                baixo dela. */}
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    {/* Ponta a ponta, o `Modal` não encolhe com o teclado em
                    nenhuma plataforma: a folha sobe por conta própria. */}
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={{ flex: 1, justifyContent: "flex-end" }}
                    >
                        <Animated.View
                            style={[StyleSheet.absoluteFill, estiloFundo]}
                        >
                            <Pressable
                                aria-label="Fechar"
                                onPress={aoFechar}
                                className="flex-1 bg-black/50"
                            />
                        </Animated.View>

                        {/* A folha para abaixo da status bar, com uma faixa do
                        fundo à vista para tocar e fechar. */}
                        <View
                            pointerEvents="box-none"
                            style={{ maxHeight: "100%", paddingTop: top + 24 }}
                        >
                            <Animated.View
                                onLayout={({ nativeEvent }) => {
                                    alturaFolha.set(nativeEvent.layout.height);
                                }}
                                style={[{ flexShrink: 1 }, estiloFolha]}
                            >
                                <View className="bg-background w-full shrink overflow-hidden rounded-t-3xl">
                                    <GestureDetector gesture={arrastar}>
                                        <View className="bg-muted border-border gap-3 border-b px-5 pt-3 pb-4">
                                            <View
                                                aria-hidden
                                                className="bg-muted-foreground/30 h-1.5 w-10 self-center rounded-full"
                                            />
                                            <View className="gap-0.5">
                                                <Text
                                                    role="heading"
                                                    className="text-foreground text-xl font-bold"
                                                >
                                                    {trecho?.titulo}
                                                </Text>
                                                {trecho?.subtitulo && (
                                                    <Text className="text-muted-foreground text-sm">
                                                        {trecho.subtitulo}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </GestureDetector>

                                    <ScrollView
                                        style={{ flexGrow: 0, flexShrink: 1 }}
                                        keyboardShouldPersistTaps="handled"
                                        contentContainerClassName="p-5"
                                    >
                                        <FieldGroup>
                                            {trecho?.campos.map(
                                                ({ chave, campo }) => (
                                                    <CampoFichaControlado
                                                        key={chave}
                                                        chave={chave}
                                                        campo={campo}
                                                        control={control}
                                                        revalidar={revalidar}
                                                    />
                                                ),
                                            )}
                                        </FieldGroup>
                                    </ScrollView>

                                    <RodapeFolha
                                        aoCancelar={aoCancelar}
                                        aoAplicar={aoAplicar}
                                    />
                                </View>
                            </Animated.View>
                        </View>
                    </KeyboardAvoidingView>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </Modal>
    );
}

/**
 * Os botões da folha. Fica num componente próprio para ler as insets do
 * `SafeAreaProvider` do `Modal`, não as da janela principal.
 */
function RodapeFolha({
    aoCancelar,
    aoAplicar,
}: {
    aoCancelar: () => void;
    aoAplicar: () => void;
}) {
    const { bottom } = useSafeAreaInsets();
    // O teclado cobre a barra de navegação: com ele aberto, a folha não
    // reserva a inset de baixo.
    const [tecladoAberto, setTecladoAberto] = useState(false);

    useEffect(() => {
        const mostrar = Keyboard.addListener("keyboardDidShow", () =>
            setTecladoAberto(true),
        );
        const esconder = Keyboard.addListener("keyboardDidHide", () =>
            setTecladoAberto(false),
        );
        return () => {
            mostrar.remove();
            esconder.remove();
        };
    }, []);

    return (
        <View
            className="bg-muted border-border flex-row gap-3 border-t px-5 pt-4"
            style={{
                paddingBottom: (tecladoAberto ? 0 : bottom) + 20,
            }}
        >
            <Button
                size="lg"
                variant="outline"
                className="flex-1"
                icone={
                    <IconeCancelar
                        size={20}
                        colorClassName="accent-foreground"
                    />
                }
                onPress={aoCancelar}
            >
                Cancelar
            </Button>
            <Button
                size="lg"
                className="flex-1"
                icone={
                    <IconeAplicar
                        size={20}
                        colorClassName="accent-primary-foreground"
                    />
                }
                onPress={aoAplicar}
            >
                Aplicar
            </Button>
        </View>
    );
}
