import { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { withUniwind } from "uniwind";

import type {
    AvaliacaoComErro,
    AvaliacaoNaFila,
    Fila,
    SituacaoNaFila,
} from "../lib/fila";
import { Button } from "~/components/ui/button";
import { cn } from "~/utils/cn";
import { formatFalta, formatHora } from "~/utils/format-date";
import { descreverEstadoFila, explicarEstadoFila } from "../lib/estado-fila";
import { IconeEstadoFila } from "./icone-estado-fila";

const IconeFechar = withUniwind(XIcon);

/**
 * O conteúdo da folha do detalhe da fila: o estado por extenso e as
 * avaliações na fila e com erro. A folha em si, com o fundo escurecido e o
 * arrastar para fechar, é a apresentação `formSheet` da rota.
 */
export function DetalheFila({
    fila,
    onFechar,
}: {
    fila: Fila;
    onFechar: () => void;
}) {
    const { bottom } = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const { estado, naFila, comErro } = fila;

    return (
        <View
            className="gap-4 px-5 pt-3"
            style={{ paddingBottom: bottom + 20 }}
        >
            {/*
             * O iOS desenha a alça da folha nativa (`sheetGrabberVisible`); o
             * Android ignora essa opção, então ela vem daqui.
             */}
            {Platform.OS === "android" && (
                <View
                    aria-hidden
                    className="bg-muted-foreground/30 h-1.5 w-10 self-center rounded-full"
                />
            )}

            <View className="flex-row items-center justify-between">
                <Text
                    role="heading"
                    className="text-foreground text-xl font-bold"
                >
                    Fila de envio
                </Text>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Fechar"
                    onPress={onFechar}
                    icone={
                        <IconeFechar
                            size={20}
                            weight="bold"
                            colorClassName="accent-foreground"
                        />
                    }
                />
            </View>

            <View
                accessible
                className="bg-muted flex-row items-center gap-3 rounded-lg p-4"
            >
                <IconeEstadoFila
                    estado={estado}
                    size={24}
                    colorClassName={
                        estado.tipo === "com_erro"
                            ? "accent-destructive"
                            : "accent-primary"
                    }
                />
                <View className="shrink gap-0.5">
                    <Text className="text-foreground text-base font-semibold">
                        {descreverEstadoFila(estado)}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                        {explicarEstadoFila(estado)}
                    </Text>
                </View>
            </View>

            {(naFila.length > 0 || comErro.length > 0) && (
                // A folha cresce com o conteúdo; muitas avaliações rolam aqui
                // dentro em vez de empurrar o título para fora da tela.
                <ScrollView
                    style={{ maxHeight: height * 0.4 }}
                    contentContainerClassName="gap-4"
                >
                    <Secao titulo="Com erro" avaliacoes={comErro} />
                    <Secao titulo="Na fila" avaliacoes={naFila} />
                </ScrollView>
            )}
        </View>
    );
}

/** Uma lista da fila com título e contagem; some quando não há nenhuma. */
function Secao({
    titulo,
    avaliacoes,
}: {
    titulo: string;
    avaliacoes: (AvaliacaoNaFila | AvaliacaoComErro)[];
}) {
    if (avaliacoes.length === 0) return null;

    return (
        <View className="gap-2">
            <Text
                role="heading"
                className="text-muted-foreground text-sm font-medium"
            >
                {titulo} ({avaliacoes.length})
            </Text>
            <View className="border-border bg-card overflow-hidden rounded-lg border">
                {avaliacoes.map((avaliacao, indice) => (
                    <ItemFila
                        key={avaliacao.id}
                        avaliacao={avaliacao}
                        // O divisor fica acima de cada item menos o primeiro,
                        // para não somar com a borda do cartão.
                        className={indice > 0 ? "border-border border-t" : ""}
                    />
                ))}
            </View>
        </View>
    );
}

/**
 * O card de uma avaliação: quem, de onde, a nota prévia à direita — sem
 * rótulo, porque a fórmula é a do backend e vale a que ele gravar — e, no
 * rodapé, onde ela está na fila ou por que o servidor a recusou. Tudo da
 * linha local, sem rede.
 */
function ItemFila({
    avaliacao,
    className,
}: {
    avaliacao: AvaliacaoNaFila | AvaliacaoComErro;
    className: string;
}) {
    const agora = useAgora();
    const rodape =
        "motivo" in avaliacao
            ? avaliacao.motivo
            : descreverSituacao(avaliacao.situacao, agora);

    return (
        <View
            accessible
            aria-label={`${avaliacao.concorrente}, ${avaliacao.origem}, nota ${avaliacao.nota}. ${rodape}`}
            className={cn("flex-row items-center gap-3 px-4 py-3", className)}
        >
            <View className="shrink grow gap-0.5">
                <Text className="text-foreground text-base font-medium">
                    {avaliacao.concorrente}
                </Text>
                <Text className="text-muted-foreground text-sm">
                    {avaliacao.origem}
                </Text>
                <Text
                    className={cn(
                        "text-sm",
                        "motivo" in avaliacao
                            ? "text-destructive"
                            : "text-muted-foreground",
                    )}
                >
                    {rodape}
                </Text>
            </View>
            <Text className="text-foreground text-2xl font-bold tabular-nums">
                {avaliacao.nota}
            </Text>
        </View>
    );
}

function descreverSituacao(situacao: SituacaoNaFila, agora: number) {
    switch (situacao.tipo) {
        case "salva":
            return `salva às ${formatHora(situacao.em)}`;
        case "enviando":
            return "enviando…";
        case "espera_conexao":
            return "espera a conexão";
        case "nova_tentativa":
            return `tentativa ${situacao.tentativa} · tenta de novo ${formatFalta(situacao.em, agora)}`;
    }
}

/** O relógio do rodapé: "tenta de novo em 2 min" anda com a folha aberta. */
function useAgora() {
    const [agora, setAgora] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setAgora(Date.now()), 15_000);
        return () => clearInterval(id);
    }, []);
    return agora;
}
