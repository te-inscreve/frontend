import { useEffect, useMemo, useState } from "react";
import { Modal, Text, useWindowDimensions, View } from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
} from "react-native-reanimated";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { withUniwind } from "uniwind";

import type { InscricaoAvaliada } from "../lib/modelo-ficha-mock";
import { Button } from "~/components/ui/button";
import { formatarDecimal } from "../lib/formulario-ficha-mock";

const Marca = withUniwind(CheckIcon);

/*
 * MOCK (TE-82): a comemoração depois do "Salvar" válido. Tudo roda na thread
 * de UI: o confete, os anéis e o selo são animações CSS do Reanimated, e os
 * textos e cartões entram com as animações de entrada dele. Só a contagem da
 * nota é JS, porque muda o texto.
 *
 * O Reanimated anima o `style`; a cor, que vem por classe do Uniwind, fica
 * numa `View` comum dentro da animada.
 */

/** As cores do confete: o claro do verde, o amarelo do aviso e os verdes do tema. */
const CORES_CONFETE = [
    "bg-primary-foreground",
    "bg-warning",
    "bg-chart-3",
    "bg-chart-5",
    "bg-accent",
];

const PECAS_CONFETE = 56;

/** Quando a contagem da nota começa, depois do selo e do título entrarem. */
const ATRASO_CONTAGEM = 700;
const DURACAO_CONTAGEM = 1400;

interface Peca {
    cor: string;
    largura: number;
    altura: number;
    atraso: number;
    duracao: number;
    animacao: object;
}

/**
 * Cada peça sai do centro num ângulo e numa força próprios, sobe até o pico
 * da explosão e cai girando, como papel. Sorteadas uma vez por abertura.
 */
function sortearConfete(alcance: number): Peca[] {
    return Array.from({ length: PECAS_CONFETE }, (_, i) => {
        const angulo = Math.random() * Math.PI * 2;
        const forca = alcance * (0.35 + Math.random() * 0.65);
        const x = Math.cos(angulo) * forca;
        // Mais para cima do que para baixo: a explosão "sobe" antes de cair.
        const y = Math.sin(angulo) * forca * 0.8 - alcance * 0.25;
        const queda = alcance * (0.6 + Math.random() * 0.6);
        const giro =
            (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
        const largura = 6 + Math.random() * 6;

        return {
            cor: CORES_CONFETE[i % CORES_CONFETE.length] ?? "bg-warning",
            largura,
            altura: largura * (1.4 + Math.random()),
            atraso: Math.random() * 120,
            duracao: 1600 + Math.random() * 1200,
            animacao: {
                "0%": {
                    opacity: 1,
                    transform: [
                        { translateX: 0 },
                        { translateY: 0 },
                        { rotate: "0deg" },
                        { scale: 0.2 },
                    ],
                },
                "22%": {
                    opacity: 1,
                    transform: [
                        { translateX: x },
                        { translateY: y },
                        { rotate: `${giro * 0.3}deg` },
                        { scale: 1 },
                    ],
                },
                "100%": {
                    opacity: 0,
                    transform: [
                        { translateX: x * 1.25 },
                        { translateY: y + queda },
                        { rotate: `${giro}deg` },
                        { scale: 0.8 },
                    ],
                },
            },
        };
    });
}

function Confete({ alcance }: { alcance: number }) {
    const pecas = useMemo(() => sortearConfete(alcance), [alcance]);

    return (
        <View
            aria-hidden
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
        >
            {pecas.map((peca, i) => (
                <Animated.View
                    key={i}
                    style={{
                        position: "absolute",
                        width: peca.largura,
                        height: peca.altura,
                        opacity: 0,
                        animationName: peca.animacao,
                        animationDuration: `${peca.duracao}ms`,
                        animationDelay: `${peca.atraso}ms`,
                        animationTimingFunction: "ease-out",
                        animationFillMode: "forwards",
                    }}
                >
                    <View className={`${peca.cor} size-full rounded-[2px]`} />
                </Animated.View>
            ))}
        </View>
    );
}

/** O selo: um clarão que estoura, anéis que pulsam e o check que salta. */
function Selo() {
    return (
        <View aria-hidden className="size-32 items-center justify-center">
            <Animated.View style={[circulo, clarao]}>
                <View className="bg-primary-foreground size-full rounded-full" />
            </Animated.View>
            {[0, 1, 2].map((anel) => (
                <Animated.View
                    key={anel}
                    style={[
                        circulo,
                        pulso,
                        { animationDelay: `${300 + anel * 450}ms` },
                    ]}
                >
                    <View className="border-primary-foreground size-full rounded-full border-2" />
                </Animated.View>
            ))}
            <Animated.View style={[circulo, salto]}>
                <View className="bg-primary-foreground size-full items-center justify-center rounded-full">
                    <Marca
                        size={64}
                        weight="bold"
                        colorClassName="accent-primary"
                    />
                </View>
            </Animated.View>
        </View>
    );
}

const circulo = {
    position: "absolute",
    width: 128,
    height: 128,
} as const;

const clarao = {
    opacity: 0,
    animationName: {
        "0%": { opacity: 0.6, transform: [{ scale: 0.3 }] },
        "100%": { opacity: 0, transform: [{ scale: 6 }] },
    },
    animationDuration: "900ms",
    animationTimingFunction: "ease-out",
} as const;

const pulso = {
    opacity: 0,
    animationName: {
        "0%": { opacity: 0.7, transform: [{ scale: 1 }] },
        "100%": { opacity: 0, transform: [{ scale: 2.4 }] },
    },
    animationDuration: "1400ms",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-out",
} as const;

const salto = {
    animationName: {
        "0%": { transform: [{ scale: 0 }, { rotate: "-90deg" }] },
        "60%": { transform: [{ scale: 1.25 }, { rotate: "12deg" }] },
        "80%": { transform: [{ scale: 0.92 }, { rotate: "-4deg" }] },
        "100%": { transform: [{ scale: 1 }, { rotate: "0deg" }] },
    },
    animationDuration: "700ms",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
} as const;

/**
 * A nota subindo de zero até o valor, desacelerando no fim. Começa do zero a
 * cada montagem: o conteúdo só monta com a tela aberta.
 */
function useContagem(alvo: number) {
    const [valor, setValor] = useState(0);

    useEffect(() => {
        let quadro = 0;
        let inicio: number | null = null;
        const espera = setTimeout(() => {
            const passo = (agora: number) => {
                inicio ??= agora;
                const t = Math.min(1, (agora - inicio) / DURACAO_CONTAGEM);
                setValor(alvo * (1 - (1 - t) ** 3));
                if (t < 1) quadro = requestAnimationFrame(passo);
            };
            quadro = requestAnimationFrame(passo);
        }, ATRASO_CONTAGEM);

        return () => {
            clearTimeout(espera);
            cancelAnimationFrame(quadro);
        };
    }, [alvo]);

    return valor;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
    return (
        <View className="flex-row items-baseline gap-4">
            <Text className="text-muted-foreground text-sm">{rotulo}</Text>
            <Text className="text-foreground ml-auto shrink text-right text-sm font-semibold">
                {valor}
            </Text>
        </View>
    );
}

export function SucessoAvaliacao({
    visivel,
    nota,
    inscricao,
    aoConcluir,
}: {
    visivel: boolean;
    nota: number;
    inscricao: InscricaoAvaliada;
    aoConcluir: () => void;
}) {
    return (
        <Modal
            visible={visivel}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={aoConcluir}
        >
            <View className="bg-primary flex-1 items-center justify-center px-6">
                {/* Monta só com a tela aberta: cada abertura sorteia o confete
                    e começa as animações e a contagem do zero. */}
                {visivel && (
                    <Conteudo
                        nota={nota}
                        inscricao={inscricao}
                        aoConcluir={aoConcluir}
                    />
                )}
            </View>
        </Modal>
    );
}

function Conteudo({
    nota,
    inscricao,
    aoConcluir,
}: {
    nota: number;
    inscricao: InscricaoAvaliada;
    aoConcluir: () => void;
}) {
    const { width, height } = useWindowDimensions();
    const contagem = useContagem(nota);
    const notaFinal = formatarDecimal(Number(nota.toFixed(2)));

    return (
        <>
            <Confete alcance={Math.min(width, height) * 0.6} />

            <View className="w-full max-w-[480px] items-center gap-6">
                <Selo />

                <Animated.View entering={FadeInDown.delay(350).springify()}>
                    <View className="items-center gap-1">
                        <Text
                            role="heading"
                            className="text-primary-foreground text-3xl font-bold"
                        >
                            Avaliação salva!
                        </Text>
                        <Text className="text-primary-foreground/80 text-base">
                            Ela já está na fila de envio.
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View
                    entering={ZoomIn.delay(550).duration(350)}
                    style={{ width: "100%" }}
                >
                    <View className="bg-card w-full items-center gap-1 rounded-2xl p-6">
                        <Text className="text-muted-foreground text-sm">
                            Nota final
                        </Text>
                        <Text aria-label={`${notaFinal} de 10`}>
                            <Text className="text-primary text-6xl font-bold">
                                {formatarDecimal(Number(contagem.toFixed(2)))}
                            </Text>
                            <Text className="text-muted-foreground text-2xl">
                                {" / 10"}
                            </Text>
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                            Cálculo provisório
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(800).springify()}
                    style={{ width: "100%" }}
                >
                    <View className="bg-card w-full gap-3 rounded-2xl p-5">
                        <View className="gap-0.5">
                            <Text className="text-foreground text-lg font-semibold">
                                {inscricao.grupo}
                            </Text>
                            <Text className="text-muted-foreground text-sm">
                                {inscricao.entidade}
                            </Text>
                        </View>
                        <Linha rotulo="Categoria" valor={inscricao.categoria} />
                        <Linha
                            rotulo="Modalidade"
                            valor={inscricao.modalidade}
                        />
                        <Linha rotulo="Evento" valor={inscricao.evento} />
                        <Linha
                            rotulo="Apresentação"
                            valor={`${inscricao.ordemApresentacao}ª`}
                        />
                    </View>
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(1050).springify()}
                    style={{ width: "100%" }}
                >
                    <View className="w-full">
                        <Button
                            size="lg"
                            variant="outline"
                            onPress={aoConcluir}
                        >
                            Concluir
                        </Button>
                    </View>
                </Animated.View>
            </View>
        </>
    );
}
