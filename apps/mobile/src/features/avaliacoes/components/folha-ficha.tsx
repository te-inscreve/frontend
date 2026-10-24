import type { Control } from "react-hook-form";
import type { ScrollViewInstance } from "react-native";
import { useEffect, useRef, useState } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { withUniwind } from "uniwind";

import type {
    CampoFicha,
    ModeloFichaDetalhe,
    ValorCampo,
    ValoresFicha,
} from "@te-inscreve/schemas";
import { formatarDecimal, tetoDoCampo } from "@te-inscreve/schemas";

import type { AbaDaFicha, TrechoFicha } from "../lib/formulario-ficha";
import type { InscricaoAvaliada } from "../lib/rota-ficha-inscricao";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/utils/cn";
import {
    abasDaFicha,
    nomeDaOcorrencia,
    posicaoDaOcorrencia,
    resumoDoValor,
    subtotalDaOcorrencia,
} from "../lib/formulario-ficha";
import { CampoFichaControlado } from "./campo-ficha";
import {
    BotaoDadosDaInscricao,
    DadosDaInscricao,
} from "./inscricao-em-avaliacao";
import { SeloModificador } from "./selo-modificador";

/*
 * A ficha inteira, a partir do modelo de ficha do web
 * (`apps/web/.../ficha-avaliativa/folha-modelo-ficha.tsx`), preenchida com as
 * respostas e dividida em abas: uma com os campos gerais, que se preenchem ali
 * mesmo, e uma por agrupamento, com um cartão por ocorrência que abre o seu
 * trecho na folha. Os agrupamentos saem da grade do web para os cartões.
 *
 * Três níveis de texto: o título de seção (`text-lg`), o nome do campo ou do
 * cartão (`text-base`) e o apoio — ajuda, valores no cartão — em `text-sm`.
 * O espaço separa as seções; linha, só a borda do cartão.
 */

const Aviso = withUniwind(WarningCircleIcon);
const Lapis = withUniwind(PencilSimpleIcon);

// A troca de aba é o eixo X compartilhado do Material: a aba de antes
// acelera para fora, a nova desacelera para dentro, cada uma em metade do
// tempo. Com "reduzir movimento" no sistema, o `withTiming` vai direto ao fim.
const DURACAO_ABA = 150;
const SAIDA = Easing.bezier(0.3, 0, 1, 1);
const ENTRADA = Easing.bezier(0, 0, 0, 1);
// Soltar depois de um quarto da tela, ou com um puxão, troca de aba. Na
// primeira e na última, o conteúdo resiste ao arrastar para onde não há aba.
const FRACAO_PARA_TROCAR = 1 / 4;
const VELOCIDADE_PARA_TROCAR = 800;
const RESISTENCIA = 0.2;

/**
 * A maior parte dos campos é obrigatória: marcar a exceção é menos ruído do
 * que um asterisco em quase todo rótulo.
 */
function Opcional() {
    return (
        <Text className="text-muted-foreground font-normal">
            {" (opcional)"}
        </Text>
    );
}

/** Sem resposta: um traço, como a célula em branco do web. */
function Traco() {
    return (
        <Text className="text-muted-foreground" aria-label="sem resposta">
            —
        </Text>
    );
}

/**
 * A nota com o teto ao lado, como "8 / 10": o mesmo do campo na edição e da
 * folha do web. Sem resposta, o traço no lugar da nota; sem teto, só a nota.
 */
function NotaComTeto({
    campo,
    resumo,
}: {
    campo: CampoFicha;
    resumo: string | null;
}) {
    const teto = tetoDoCampo(campo);
    return (
        <Text
            className={cn(
                "text-sm",
                resumo ? "text-foreground font-bold" : "text-muted-foreground",
            )}
        >
            {resumo ?? "—"}
            {teto !== null && (
                <Text className="text-muted-foreground font-normal">
                    {` / ${formatarDecimal(teto)}`}
                </Text>
            )}
        </Text>
    );
}

/**
 * Uma resposta da ocorrência, na largura toda do cartão: o nome e o selo em
 * cima, o valor embaixo. Sem a ajuda do campo: o cartão é um resumo.
 */
function RespostaDoCartao({
    campo,
    valor,
}: {
    campo: CampoFicha;
    valor: ValorCampo;
}) {
    const resumo = resumoDoValor(campo, valor);

    return (
        <View className="gap-0.5">
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <Text className="text-muted-foreground shrink text-sm">
                    {campo.nome}
                    {!campo.obrigatorio && <Opcional />}
                </Text>
                {campo.modificadorNota && (
                    <SeloModificador modificador={campo.modificadorNota} />
                )}
            </View>
            {campo.tipo === "NUMERICO" ? (
                <NotaComTeto campo={campo} resumo={resumo} />
            ) : resumo ? (
                <Text
                    numberOfLines={2}
                    className="text-foreground text-sm font-semibold"
                >
                    {resumo}
                </Text>
            ) : (
                <Traco />
            )}
        </View>
    );
}

/**
 * Uma ocorrência como cartão: o título e o total em faixas `muted`, os campos
 * no meio. Tocar no cartão abre o trecho na folha.
 */
function CartaoOcorrencia({
    aba,
    linha,
    valores,
    erro,
    aoTocar,
}: {
    aba: Extract<AbaDaFicha, { tipo: "agrupamento" }>;
    linha: Extract<AbaDaFicha, { tipo: "agrupamento" }>["linhas"][number];
    valores: ValoresFicha;
    erro: boolean;
    aoTocar: () => void;
}) {
    // O total da ocorrência só existe onde há nota a somar.
    const temTotal = linha.campos.some(
        ({ campo }) => campo.tipo === "NUMERICO",
    );
    const total = subtotalDaOcorrencia(linha.campos, valores);
    const nome = nomeDaOcorrencia(aba.agrupamento, linha.ordem, valores);
    const posicao = posicaoDaOcorrencia(aba.agrupamento, linha.ordem);
    const vazia = linha.campos.every(
        ({ chave, campo }) =>
            resumoDoValor(campo, valores[chave] ?? null) === null,
    );

    return (
        <Pressable
            role="button"
            aria-label={`Preencher ${nome}, ${posicao}${erro ? ", com erro" : ""}`}
            onPress={aoTocar}
            className="border-border bg-card overflow-hidden rounded-lg border"
        >
            {/* O erro do cartão é só o selo. */}
            <View className="bg-muted flex-row items-center gap-2 px-4 py-2.5">
                <View className="shrink gap-0.5">
                    <Text className="text-foreground text-base font-semibold">
                        {nome}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                        {posicao}
                    </Text>
                </View>
                {erro && (
                    <Badge
                        variant="destructive"
                        icone={Aviso}
                        className="ml-auto self-center"
                    >
                        Com erro
                    </Badge>
                )}
            </View>

            {/* Em branco, o cartão só convida a preencher: uma lista de
                traços não diz nada. */}
            {vazia ? (
                <View className="flex-row items-center gap-2 p-4">
                    <Lapis
                        size={16}
                        colorClassName="accent-muted-foreground"
                        aria-hidden
                    />
                    <Text className="text-muted-foreground text-sm">
                        Toque para preencher
                    </Text>
                </View>
            ) : (
                <>
                    <View className="gap-3 p-4">
                        {linha.campos.map(({ chave, campo }) => (
                            <RespostaDoCartao
                                key={chave}
                                campo={campo}
                                valor={valores[chave] ?? null}
                            />
                        ))}
                    </View>
                    {temTotal && (
                        <View className="bg-muted flex-row items-center px-4 py-2.5">
                            <Text className="text-foreground text-sm font-semibold">
                                Total
                            </Text>
                            {total === null ? (
                                <Text className="text-muted-foreground ml-auto text-sm font-bold">
                                    —
                                </Text>
                            ) : (
                                <Text className="text-foreground ml-auto text-sm font-bold">
                                    {formatarDecimal(total)}
                                </Text>
                            )}
                        </View>
                    )}
                </>
            )}
        </Pressable>
    );
}

/**
 * As abas no topo da ficha: rolam de lado quando não cabem, e um ponto
 * vermelho marca a que tem erro, para o avaliador achar sem abrir uma a uma.
 * O sublinhado verde desliza até a aba escolhida, e a barra rola para mantê-la
 * à vista.
 */
function BarraDeAbas({
    abas,
    atual,
    comErro,
    aoTrocar,
}: {
    abas: AbaDaFicha[];
    atual: string;
    comErro: (aba: AbaDaFicha) => boolean;
    aoTrocar: (chave: string) => void;
}) {
    const rolagem = useRef<ScrollViewInstance>(null);
    const [medidas, setMedidas] = useState<
        Record<string, { x: number; largura: number }>
    >({});
    const x = useSharedValue(0);
    const largura = useSharedValue(0);

    useEffect(() => {
        const medida = medidas[atual];
        if (!medida) return;
        // Na primeira medida o sublinhado já nasce no lugar.
        if (largura.get() === 0) {
            x.set(medida.x);
            largura.set(medida.largura);
        } else {
            const config = { duration: DURACAO_ABA * 2, easing: ENTRADA };
            x.set(withTiming(medida.x, config));
            largura.set(withTiming(medida.largura, config));
        }
        rolagem.current?.scrollTo({
            x: Math.max(0, medida.x - 16),
            animated: true,
        });
    }, [atual, medidas, x, largura]);

    const estiloSublinhado = useAnimatedStyle(() => ({
        opacity: largura.get() === 0 ? 0 : 1,
        transform: [{ translateX: x.get() }],
        width: largura.get(),
    }));

    return (
        <View>
            <ScrollView
                ref={rolagem}
                horizontal
                showsHorizontalScrollIndicator={false}
                role="tablist"
            >
                {abas.map((aba) => {
                    const selecionada = aba.chave === atual;
                    const erro = comErro(aba);
                    return (
                        <Pressable
                            key={aba.chave}
                            role="tab"
                            aria-selected={selecionada}
                            aria-label={`${aba.titulo}${erro ? ", com erro" : ""}`}
                            onPress={() => aoTrocar(aba.chave)}
                            onLayout={({ nativeEvent: { layout } }) =>
                                setMedidas((antes) => ({
                                    ...antes,
                                    [aba.chave]: {
                                        x: layout.x,
                                        largura: layout.width,
                                    },
                                }))
                            }
                            // A borda transparente guarda o lugar do
                            // sublinhado, que desce 1pt para cobrir a da barra.
                            className="-mb-px flex-row items-center gap-1.5 border-b-2 border-transparent px-4 py-3"
                        >
                            <Text
                                className={cn(
                                    "text-base",
                                    selecionada
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground",
                                )}
                            >
                                {aba.titulo}
                            </Text>
                            {erro && (
                                <View
                                    aria-hidden
                                    className="bg-destructive size-2 rounded-full"
                                />
                            )}
                        </Pressable>
                    );
                })}
                <Animated.View
                    aria-hidden
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            left: 0,
                            bottom: -1,
                            height: 2,
                        },
                        estiloSublinhado,
                    ]}
                >
                    <View className="bg-primary flex-1" />
                </Animated.View>
            </ScrollView>
        </View>
    );
}

export function FolhaFicha({
    modelo,
    inscricao,
    trechos,
    valores,
    comErro,
    aoTocar,
    aba,
    aoTrocarAba,
    control,
    revalidar,
}: {
    modelo: ModeloFichaDetalhe;
    inscricao: InscricaoAvaliada;
    trechos: TrechoFicha[];
    valores: ValoresFicha;
    comErro: (trecho: number) => boolean;
    aoTocar: (trecho: number) => void;
    /** A chave da aba aberta (`abaDoTrecho`). */
    aba: string;
    aoTrocarAba: (chave: string) => void;
    control: Control<ValoresFicha>;
    revalidar: (chave: string) => Promise<boolean>;
}) {
    const abas = abasDaFicha(trechos);
    const aberta = abas.find(({ chave }) => chave === aba) ?? abas[0];
    const abaComErro = (alvo: AbaDaFicha) =>
        alvo.linhas.some(({ trecho }) => comErro(trecho));
    const { width: larguraJanela } = useWindowDimensions();
    const chaves = abas.map(({ chave }) => chave);
    const atual = aberta?.chave ?? "";
    const indiceAtual = chaves.indexOf(atual);
    // A aba na tela fica para trás da escolhida enquanto sai: toque na barra,
    // deslize ou o "Salvar" que leva ao erro, todos trocam por aqui.
    const [exibida, setExibida] = useState(atual);
    const [dadosAbertos, setDadosAbertos] = useState(false);
    const indiceExibida = chaves.indexOf(exibida);
    const naTela = abas[indiceExibida] ?? aberta;
    // Quanto o conteúdo está fora do lugar, na horizontal.
    const deslocamento = useSharedValue(0);

    useEffect(() => {
        if (indiceAtual === indiceExibida) return;
        // Avançar empurra a aba de antes para a esquerda; voltar, para a
        // direita. A nova vem do lado oposto.
        const direcao = indiceAtual > indiceExibida ? 1 : -1;
        deslocamento.set(
            withTiming(
                -direcao * larguraJanela,
                { duration: DURACAO_ABA, easing: SAIDA },
                (terminou) => {
                    if (!terminou) return;
                    deslocamento.set(direcao * larguraJanela);
                    scheduleOnRN(setExibida, atual);
                },
            ),
        );
    }, [atual, indiceAtual, indiceExibida, larguraJanela, deslocamento]);

    useEffect(() => {
        deslocamento.set(
            withTiming(0, { duration: DURACAO_ABA, easing: ENTRADA }),
        );
    }, [exibida, deslocamento]);

    const anterior = chaves[indiceAtual - 1];
    const proxima = chaves[indiceAtual + 1];
    // Só o arrasto de lado é da aba: o vertical continua rolando a ficha.
    const deslizar = Gesture.Pan()
        .enabled(abas.length > 1)
        .activeOffsetX([-20, 20])
        .failOffsetY([-12, 12])
        .onUpdate(({ translationX }) => {
            const vizinha = translationX < 0 ? proxima : anterior;
            deslocamento.set(
                vizinha ? translationX : translationX * RESISTENCIA,
            );
        })
        .onEnd(({ translationX, velocityX }) => {
            const vizinha = translationX < 0 ? proxima : anterior;
            const passou =
                Math.abs(translationX) > larguraJanela * FRACAO_PARA_TROCAR ||
                (Math.abs(velocityX) > VELOCIDADE_PARA_TROCAR &&
                    Math.sign(velocityX) === Math.sign(translationX));
            if (vizinha && passou) {
                scheduleOnRN(aoTrocarAba, vizinha);
            } else {
                deslocamento.set(
                    withTiming(0, { duration: DURACAO_ABA, easing: ENTRADA }),
                );
            }
        });

    const estiloConteudo = useAnimatedStyle(() => ({
        transform: [{ translateX: deslocamento.get() }],
    }));

    return (
        <View className="grow">
            {/* O título e as abas numa faixa `muted` de lado a lado. A borda
                de baixo dela é a da barra de abas, onde o sublinhado verde
                assenta. */}
            <View
                className={cn(
                    "bg-muted border-border border-b px-4 pt-4",
                    abas.length > 1 ? "" : "pb-6",
                )}
            >
                {/* Sem a prancheta do web. No tablet, a ficha não passa de
                    720pt e fica no meio: na largura toda, o olho anda demais
                    de um lado ao outro. */}
                <View className="w-full max-w-[720px] gap-6 self-center">
                    <Pressable
                        role="button"
                        aria-label="Dados da inscrição avaliada"
                        aria-expanded={dadosAbertos}
                        onPress={() => setDadosAbertos((atual) => !atual)}
                        hitSlop={8}
                    >
                        <View className="mt-2 flex-row items-center gap-3">
                            <View className="flex-1 gap-1">
                                <Text
                                    role="heading"
                                    className="text-foreground text-2xl leading-tight font-bold tracking-tight"
                                >
                                    {`Avaliando ${inscricao.concorrente}`}
                                </Text>
                                <Text className="text-muted-foreground text-sm">
                                    {`Modelo de ficha: ${modelo.nome}`}
                                </Text>
                            </View>
                            <BotaoDadosDaInscricao aberto={dadosAbertos} />
                        </View>
                    </Pressable>

                    {dadosAbertos && <DadosDaInscricao inscricao={inscricao} />}

                    {abas.length > 1 && aberta && (
                        <BarraDeAbas
                            abas={abas}
                            atual={aberta.chave}
                            comErro={abaComErro}
                            aoTrocar={aoTrocarAba}
                        />
                    )}
                </View>
            </View>

            {/* O arrasto vale na área toda abaixo das abas, até onde a ficha
                acaba, não só sobre os cartões. */}
            <GestureDetector gesture={deslizar}>
                <Animated.View style={[{ flexGrow: 1 }, estiloConteudo]}>
                    <View className="grow px-4 pt-6 pb-4">
                        <View className="w-full max-w-[720px] self-center">
                            {naTela?.tipo === "campos" && (
                                <View className="gap-8">
                                    {naTela.linhas.map(({ chave, campo }) => (
                                        <CampoFichaControlado
                                            key={chave}
                                            chave={chave}
                                            campo={campo}
                                            control={control}
                                            revalidar={revalidar}
                                            naFicha
                                        />
                                    ))}
                                </View>
                            )}

                            {naTela?.tipo === "agrupamento" && (
                                <View className="gap-3">
                                    <Text className="text-muted-foreground text-sm">
                                        {naTela.agrupamento.quantidade === 1
                                            ? "1 ocorrência"
                                            : `${naTela.agrupamento.quantidade} ocorrências`}
                                    </Text>
                                    {naTela.linhas.map((linha) => (
                                        <CartaoOcorrencia
                                            key={linha.trecho}
                                            aba={naTela}
                                            linha={linha}
                                            valores={valores}
                                            erro={comErro(linha.trecho)}
                                            aoTocar={() =>
                                                aoTocar(linha.trecho)
                                            }
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

/**
 * A ficha enquanto o modelo não chega, com a geometria da {@link FolhaFicha}
 * e do rodapé do formulário: título e abas na faixa `muted`, campos abaixo,
 * nota e "Salvar" embaixo.
 */
export function FolhaFichaSkeleton() {
    return (
        <View aria-hidden className="flex-1">
            <View className="bg-muted border-border border-b px-4 pt-4">
                <View className="w-full max-w-[720px] gap-6 self-center">
                    <View className="mt-2 gap-2">
                        <View className="bg-background h-7 w-2/3 rounded" />
                        <View className="bg-background h-4 w-1/2 rounded" />
                    </View>
                    <View className="flex-row gap-2 pb-3">
                        {[0, 1, 2].map((posicao) => (
                            <View
                                key={posicao}
                                className="bg-background h-6 w-24 rounded"
                            />
                        ))}
                    </View>
                </View>
            </View>
            <View className="flex-1 px-4 pt-6">
                <View className="w-full max-w-[720px] gap-8 self-center">
                    {[0, 1, 2].map((posicao) => (
                        <View key={posicao} className="gap-2">
                            <View className="bg-muted h-5 w-1/3 rounded" />
                            <View className="bg-muted h-12 rounded-md" />
                        </View>
                    ))}
                </View>
            </View>
            <View className="bg-card border-border border-t p-4">
                <View className="w-full max-w-[720px] flex-row items-center gap-4 self-center">
                    <View className="flex-1 gap-1.5">
                        <View className="bg-muted h-7 w-32 rounded" />
                        <View className="bg-muted h-4 w-28 rounded" />
                    </View>
                    <View className="bg-muted h-10 w-24 rounded-md" />
                </View>
            </View>
        </View>
    );
}
