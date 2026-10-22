import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, {
    LayoutAnimationConfig,
    useSharedValue,
} from "react-native-reanimated";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowArcRightIcon, ArrowDownIcon } from "phosphor-react-native";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { ArrowRightIcon } from "phosphor-react-native/src/icons/ArrowRight";
import { FloppyDiskIcon } from "phosphor-react-native/src/icons/FloppyDisk";
import { useForm } from "react-hook-form";
import { withUniwind } from "uniwind";

import type { ModeloFichaDetalhe } from "@te-inscreve/schemas";

import type { DirecaoEtapa } from "../lib/deslize-etapa";
import type { EtapaFicha, ValoresFicha } from "../lib/formulario-ficha-mock";
import { Button } from "~/components/ui/button";
import { FieldGroup } from "~/components/ui/field";
import { cn } from "~/utils/cn";
import { entradaDaEtapa, saidaDaEtapa } from "../lib/deslize-etapa";
import {
    etapasDaFicha,
    montarFormularioFicha,
} from "../lib/formulario-ficha-mock";
import { CampoFichaControlado } from "./campo-ficha";
import { FolhaRevisao } from "./folha-revisao";

const IconeVoltar = withUniwind(ArrowLeftIcon);
const IconeProxima = withUniwind(ArrowRightIcon);
const IconeVoltarRevisao = withUniwind(ArrowArcRightIcon);
const IconeSalvar = withUniwind(FloppyDiskIcon);
const IconeFicar = withUniwind(ArrowDownIcon);

/** Barra segmentada: uma fatia por etapa, mais a revisão. */
function Progresso({
    total,
    atual,
    titulo,
}: {
    total: number;
    atual: number;
    titulo: string;
}) {
    return (
        <View
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={atual + 1}
            aria-valuetext={`Etapa ${atual + 1} de ${total}: ${titulo}`}
            className="bg-background border-border gap-2 border-b px-4 py-3"
        >
            <View className="flex-row gap-1" aria-hidden>
                {Array.from({ length: total }, (_, i) => (
                    <View
                        key={i}
                        className={cn(
                            "h-1.5 flex-1 rounded-full",
                            i <= atual ? "bg-primary" : "bg-muted",
                        )}
                    />
                ))}
            </View>
            <Text className="text-muted-foreground text-sm">
                Etapa {atual + 1} de {total}
            </Text>
        </View>
    );
}

function Cabecalho({
    titulo,
    subtitulo,
}: {
    titulo: string;
    subtitulo?: string;
}) {
    return (
        <View className="gap-0.5">
            <Text
                role="heading"
                className="text-foreground text-xl font-semibold"
            >
                {titulo}
            </Text>
            {subtitulo && (
                <Text className="text-muted-foreground text-sm">
                    {subtitulo}
                </Text>
            )}
        </View>
    );
}

function Rodape({ children }: { children: ReactNode }) {
    return (
        <View className="bg-background border-border flex-row gap-3 border-t p-4">
            {children}
        </View>
    );
}

/**
 * MOCK (TE-82): o formulário em etapas da spec — gerais consecutivos numa
 * etapa, uma etapa por ocorrência, revisão no fim. Valida só a etapa atual ao
 * avançar; na revisão, tocar numa etapa volta para ela. Nome editável da
 * ocorrência, prévia da nota, rascunho e envio ficam para TE-70/TE-95.
 */
export function FormularioFichaMock({
    modelo,
}: {
    modelo: ModeloFichaDetalhe;
}) {
    const { schema, defaultValues } = useMemo(
        () => montarFormularioFicha(modelo),
        [modelo],
    );
    const etapas = useMemo(() => etapasDaFicha(modelo), [modelo]);
    const form = useForm<ValoresFicha>({
        resolver: zodResolver(schema),
        defaultValues,
    });
    const [atual, setAtual] = useState(0);
    // Quem chega a uma etapa pela revisão volta direto para ela, sem
    // atravessar as etapas seguintes.
    const [vindoDaRevisao, setVindoDaRevisao] = useState(false);
    const direcao = useSharedValue<DirecaoEtapa>(1);
    const entrada = useMemo(() => entradaDaEtapa(direcao), [direcao]);
    const saida = useMemo(() => saidaDaEtapa(direcao), [direcao]);

    // A revisão é a etapa depois da última do modelo.
    const total = etapas.length + 1;
    const naRevisao = atual === etapas.length;
    const etapa = etapas[atual];
    const erros = form.formState.errors;
    const etapaComErro = (alvo: EtapaFicha) =>
        alvo.campos.some(({ chave }) => erros[chave]);

    /**
     * Toda troca de etapa passa por aqui: a direção vai para o shared value
     * antes do `setAtual`, para a etapa que sai e a que entra deslizarem para
     * o mesmo lado. O teclado fecha antes, ou ficaria aberto sobre a etapa
     * nova quando o campo focado desmontasse.
     */
    function irPara(destino: number) {
        // `.set`, não `.value =`: o React Compiler não aceita mutar o retorno
        // de um hook.
        direcao.set(destino > atual ? 1 : -1);
        Keyboard.dismiss();
        setAtual(destino);
    }

    function irPelaRevisao(destino: number) {
        setVindoDaRevisao(true);
        irPara(destino);
    }

    /** Valida a etapa atual e, se passar, vai para `destino`. */
    async function avancar(destino: number) {
        if (!etapa) return;
        const ok = await form.trigger(etapa.campos.map(({ chave }) => chave));
        if (!ok) return;
        if (destino === etapas.length) setVindoDaRevisao(false);
        irPara(destino);
    }

    const salvar = form.handleSubmit(
        () =>
            Alert.alert(
                "Avaliação pronta",
                "No app de verdade, ela iria para a fila de envio.",
            ),
        () => {
            const primeira = etapas.findIndex(etapaComErro);
            if (primeira >= 0) irPelaRevisao(primeira);
        },
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
        >
            <Progresso
                total={total}
                atual={atual}
                titulo={etapa?.titulo ?? "Revisão"}
            />

            {/*
             * Cada etapa é um `Animated.View` com a própria chave: na troca, a
             * velha sai e a nova entra ao mesmo tempo, e a nova começa do
             * topo. O `skipEntering` deixa a primeira etapa aparecer sem
             * deslizar ao abrir a tela; o `overflow-hidden` corta as duas
             * enquanto passam.
             */}
            <LayoutAnimationConfig skipEntering>
                <View className="flex-1 overflow-hidden">
                    <Animated.View
                        key={atual}
                        entering={entrada}
                        exiting={saida}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerClassName="gap-5 p-4 pb-8"
                        >
                            {etapa ? (
                                <>
                                    <Cabecalho
                                        titulo={etapa.titulo}
                                        subtitulo={etapa.subtitulo}
                                    />
                                    <FieldGroup>
                                        {etapa.campos.map(
                                            ({ chave, campo }) => (
                                                <CampoFichaControlado
                                                    key={chave}
                                                    chave={chave}
                                                    campo={campo}
                                                    control={form.control}
                                                    revalidar={form.trigger}
                                                />
                                            ),
                                        )}
                                    </FieldGroup>
                                </>
                            ) : (
                                <>
                                    <FolhaRevisao
                                        modelo={modelo}
                                        etapas={etapas}
                                        valores={form.getValues()}
                                        comErro={(i) => {
                                            const alvo = etapas[i];
                                            return !!alvo && etapaComErro(alvo);
                                        }}
                                        aoTocar={irPelaRevisao}
                                    />
                                </>
                            )}
                        </ScrollView>
                    </Animated.View>
                </View>
            </LayoutAnimationConfig>

            <Rodape>
                {vindoDaRevisao && !naRevisao ? (
                    // Sem "Voltar" aqui: ao lado de "Voltar à revisão", seriam
                    // dois "voltar" com destinos diferentes. "Ficar aqui"
                    // devolve a navegação entre etapas.
                    <>
                        <Button
                            variant="outline"
                            className="flex-1"
                            icone={
                                <IconeFicar
                                    size={20}
                                    colorClassName="accent-foreground"
                                />
                            }
                            onPress={() => setVindoDaRevisao(false)}
                        >
                            Ficar aqui
                        </Button>
                        <Button
                            className="flex-1"
                            iconeDepois={
                                <IconeVoltarRevisao
                                    size={20}
                                    colorClassName="accent-primary-foreground"
                                />
                            }
                            onPress={() => void avancar(etapas.length)}
                        >
                            Voltar à revisão
                        </Button>
                    </>
                ) : (
                    <>
                        {atual > 0 && (
                            <Button
                                variant="outline"
                                className="flex-1"
                                icone={
                                    <IconeVoltar
                                        size={20}
                                        colorClassName="accent-foreground"
                                    />
                                }
                                onPress={() => irPara(atual - 1)}
                            >
                                Anterior
                            </Button>
                        )}
                        {naRevisao ? (
                            <Button
                                className="flex-1"
                                icone={
                                    <IconeSalvar
                                        size={20}
                                        colorClassName="accent-primary-foreground"
                                    />
                                }
                                onPress={() => void salvar()}
                            >
                                Salvar
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                className="flex-1"
                                iconeDepois={
                                    <IconeProxima
                                        size={20}
                                        colorClassName="accent-primary-foreground"
                                    />
                                }
                                onPress={() => void avancar(atual + 1)}
                            >
                                Próximo
                            </Button>
                        )}
                    </>
                )}
            </Rodape>
        </KeyboardAvoidingView>
    );
}
