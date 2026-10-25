import type { Ref } from "react";
import type { Control } from "react-hook-form";
import { useImperativeHandle, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
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

import type { SecaoDaFicha, TrechoFicha } from "../lib/formulario-ficha";
import type { InscricaoAvaliada } from "../lib/rota-ficha-inscricao";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/utils/cn";
import {
    nomeDaOcorrencia,
    posicaoDaOcorrencia,
    resumoDoValor,
    secoesDaFicha,
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
 * respostas, numa página só e na ordem do topo do modelo: os campos gerais se
 * preenchem ali mesmo, e cada agrupamento é uma seção com um cartão por
 * ocorrência que abre o seu trecho na folha. Os agrupamentos saem da grade do
 * web para os cartões.
 *
 * Três níveis de texto: o título de seção (`text-lg`), o nome do campo ou do
 * cartão (`text-base`) e o apoio — ajuda, valores no cartão — em `text-sm`.
 * O espaço separa as seções; linha, só a borda do cartão.
 */

const Aviso = withUniwind(WarningCircleIcon);
const Lapis = withUniwind(PencilSimpleIcon);

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
 * Uma ocorrência como cartão: o título e o total numa faixa `muted` em cima,
 * os campos embaixo. Tocar no cartão abre o trecho na folha.
 */
function CartaoOcorrencia({
    secao,
    linha,
    valores,
    erro,
    aoTocar,
}: {
    secao: Extract<SecaoDaFicha, { tipo: "agrupamento" }>;
    linha: Extract<SecaoDaFicha, { tipo: "agrupamento" }>["linhas"][number];
    valores: ValoresFicha;
    erro: boolean;
    aoTocar: () => void;
}) {
    // O total da ocorrência só existe onde há nota a somar.
    const temTotal = linha.campos.some(
        ({ campo }) => campo.tipo === "NUMERICO",
    );
    const total = subtotalDaOcorrencia(linha.campos, valores);
    const nome = nomeDaOcorrencia(secao.agrupamento, linha.ordem, valores);
    const posicao = posicaoDaOcorrencia(secao.agrupamento, linha.ordem);
    const vazia = linha.campos.every(
        ({ chave, campo }) =>
            resumoDoValor(campo, valores[chave] ?? null) === null,
    );

    return (
        <Pressable
            role="button"
            aria-label={`Preencher ${nome}, ${posicao}${temTotal ? `, total ${total === null ? "sem nota" : formatarDecimal(total)}` : ""}${erro ? ", com erro" : ""}`}
            onPress={aoTocar}
            className="border-border bg-card overflow-hidden rounded-lg border"
        >
            {/* O erro do cartão é só o selo. O total fica no canto, numa
                caixa clara sobre a faixa `muted`, que a borda e a sombra
                levantam: é o número que o avaliador procura no cartão. */}
            <View className="bg-muted border-border flex-row items-center gap-2 border-b px-4 py-2.5">
                <View className="shrink gap-0.5">
                    <Text className="text-foreground text-base font-semibold">
                        {nome}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                        {posicao}
                    </Text>
                </View>
                <View className="ml-auto flex-row items-center gap-2">
                    {erro && (
                        <Badge variant="destructive" icone={Aviso}>
                            Com erro
                        </Badge>
                    )}
                    {temTotal && (
                        <View
                            aria-hidden
                            className="bg-card border-border min-w-14 items-center rounded-md border px-2.5 py-1 shadow-sm"
                        >
                            <Text
                                className={cn(
                                    "text-lg font-bold",
                                    total === null
                                        ? "text-muted-foreground"
                                        : "text-foreground",
                                )}
                            >
                                {total === null ? "—" : formatarDecimal(total)}
                            </Text>
                            <Text className="text-muted-foreground text-xs">
                                total
                            </Text>
                        </View>
                    )}
                </View>
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
                <View className="gap-3 p-4">
                    {linha.campos.map(({ chave, campo }) => (
                        <RespostaDoCartao
                            key={chave}
                            campo={campo}
                            valor={valores[chave] ?? null}
                        />
                    ))}
                </View>
            )}
        </Pressable>
    );
}

/** O que a ficha responde a quem a rola. */
export interface FolhaFichaHandle {
    /**
     * Onde o trecho começa, em pontos a partir do topo da ficha, ou nulo
     * antes de ele ser medido.
     */
    topoDoTrecho: (trecho: number) => number | null;
}

export function FolhaFicha({
    ref,
    modelo,
    inscricao,
    trechos,
    valores,
    comErro,
    aoTocar,
    control,
    revalidar,
}: {
    ref?: Ref<FolhaFichaHandle>;
    modelo: ModeloFichaDetalhe;
    inscricao: InscricaoAvaliada;
    trechos: TrechoFicha[];
    valores: ValoresFicha;
    comErro: (trecho: number) => boolean;
    aoTocar: (trecho: number) => void;
    control: Control<ValoresFicha>;
    revalidar: (chave: string) => Promise<boolean>;
}) {
    const secoes = secoesDaFicha(trechos);
    const [dadosAbertos, setDadosAbertos] = useState(false);
    // Cada `onLayout` dá a posição no pai: o topo da lista na ficha, o da
    // seção na lista e o do cartão na seção. O trecho soma os três.
    const medidas = useRef({
        lista: 0,
        secoes: new Map<string, number>(),
        cartoes: new Map<number, number>(),
    });

    useImperativeHandle(ref, () => ({
        topoDoTrecho(trecho) {
            const secao = secoes.find((alvo) =>
                alvo.tipo === "campo"
                    ? alvo.trecho === trecho
                    : alvo.linhas.some((linha) => linha.trecho === trecho),
            );
            if (!secao) return null;
            const { lista, secoes: topos, cartoes } = medidas.current;
            const topoSecao = topos.get(secao.chave);
            const topoCartao = secao.tipo === "campo" ? 0 : cartoes.get(trecho);
            if (topoSecao === undefined || topoCartao === undefined)
                return null;
            return lista + topoSecao + topoCartao;
        },
    }));

    return (
        <View className="grow">
            {/* O título numa faixa `muted` de lado a lado. */}
            <View className="bg-muted border-border border-b px-4 pt-4 pb-6">
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
                </View>
            </View>

            {/* O respiro de cima fica na lista, não aqui: assim o topo de
                cada seção já o inclui. */}
            <View
                className="grow px-4 pb-4"
                onLayout={({ nativeEvent: { layout } }) => {
                    medidas.current.lista = layout.y;
                }}
            >
                <View className="w-full max-w-[720px] gap-8 self-center pt-6">
                    {secoes.map((secao) => (
                        <View
                            key={secao.chave}
                            onLayout={({ nativeEvent: { layout } }) => {
                                medidas.current.secoes.set(
                                    secao.chave,
                                    layout.y,
                                );
                            }}
                        >
                            {secao.tipo === "campo" ? (
                                <CampoFichaControlado
                                    chave={secao.chave}
                                    campo={secao.campo}
                                    control={control}
                                    revalidar={revalidar}
                                    naFicha
                                />
                            ) : (
                                <View className="gap-3">
                                    <View className="gap-0.5">
                                        <Text
                                            role="heading"
                                            className="text-foreground text-lg font-semibold"
                                        >
                                            {secao.titulo}
                                        </Text>
                                        <Text className="text-muted-foreground text-sm">
                                            {secao.agrupamento.quantidade === 1
                                                ? "1 ocorrência"
                                                : `${secao.agrupamento.quantidade} ocorrências`}
                                        </Text>
                                    </View>
                                    {secao.linhas.map((linha) => (
                                        <View
                                            key={linha.trecho}
                                            onLayout={({
                                                nativeEvent: { layout },
                                            }) => {
                                                medidas.current.cartoes.set(
                                                    linha.trecho,
                                                    layout.y,
                                                );
                                            }}
                                        >
                                            <CartaoOcorrencia
                                                secao={secao}
                                                linha={linha}
                                                valores={valores}
                                                erro={comErro(linha.trecho)}
                                                aoTocar={() =>
                                                    aoTocar(linha.trecho)
                                                }
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

/**
 * A ficha enquanto o modelo não chega, com a geometria da {@link FolhaFicha}
 * e do rodapé do formulário: título na faixa `muted`, campos abaixo,
 * nota e "Salvar" embaixo.
 */
export function FolhaFichaSkeleton() {
    return (
        <View aria-hidden className="flex-1">
            <View className="bg-muted border-border border-b px-4 pt-4 pb-6">
                <View className="w-full max-w-[720px] gap-6 self-center">
                    <View className="mt-2 gap-2">
                        <View className="bg-background h-7 w-2/3 rounded" />
                        <View className="bg-background h-4 w-1/2 rounded" />
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
