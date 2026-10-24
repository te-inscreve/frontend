import { Text, View } from "react-native";

import type { MinhaAvaliacao as MinhaAvaliacaoDados } from "@te-inscreve/schemas";

import type { SecaoMinhasAvaliacoes } from "../lib/minhas-avaliacoes";
import { formatDate } from "~/utils/format-date";
import { formatarNota, nomeDoAvaliado } from "../lib/minhas-avaliacoes";

/** O título da categoria sobre as avaliações dela, com o evento embaixo. */
export function CabecalhoSecaoMinhasAvaliacoes({
    secao,
}: {
    secao: SecaoMinhasAvaliacoes;
}) {
    return (
        <View className="bg-background gap-0.5 pt-4 pb-2">
            <Text
                role="heading"
                className="text-foreground text-base leading-tight font-bold"
            >
                {secao.titulo}
            </Text>
            <Text className="text-muted-foreground text-sm">
                {secao.eventoNome}
            </Text>
        </View>
    );
}

/**
 * Uma avaliação aceita pelo servidor: quem se apresentou, de onde, quando foi
 * enviada e a nota que o servidor calculou. Só leitura: o que chegou ao
 * servidor não muda mais.
 */
export function MinhaAvaliacao({
    avaliacao,
}: {
    avaliacao: MinhaAvaliacaoDados;
}) {
    const nome = nomeDoAvaliado(avaliacao);
    const nota = formatarNota(avaliacao.nota);
    const enviada = formatarEnvio(new Date(avaliacao.dataEnvio));

    return (
        <View
            accessible
            aria-label={`${nome}, ${avaliacao.entidade.nome}, nota ${nota} de 10, enviada em ${enviada}`}
            className="border-border bg-card flex-row items-center gap-3 rounded-xl border p-3"
        >
            <View className="flex-1 gap-0.5">
                <Text
                    numberOfLines={1}
                    className="text-card-foreground text-base font-semibold"
                >
                    {nome}
                </Text>
                <Text
                    numberOfLines={1}
                    className="text-muted-foreground text-sm"
                >
                    {`${avaliacao.entidade.nome} · ${avaliacao.entidade.cidade}`}
                </Text>
                <Text className="text-muted-foreground text-sm">
                    {`Enviada em ${enviada}`}
                </Text>
            </View>
            <View className="bg-muted min-w-16 items-center rounded-lg px-3 py-2">
                <Text className="text-foreground text-xl font-bold">
                    {nota}
                </Text>
                <Text className="text-muted-foreground text-xs">de 10</Text>
            </View>
        </View>
    );
}

/** A geometria de {@link MinhaAvaliacao}: três linhas e a caixa da nota. */
export function MinhaAvaliacaoSkeleton() {
    return (
        <View
            aria-hidden
            className="border-border bg-card flex-row items-center gap-3 rounded-xl border p-3"
        >
            <View className="flex-1 gap-1.5">
                <View className="bg-muted h-5 w-2/3 rounded" />
                <View className="bg-muted h-4 w-1/2 rounded" />
                <View className="bg-muted h-4 w-1/3 rounded" />
            </View>
            <View className="bg-muted h-14 w-16 rounded-lg" />
        </View>
    );
}

/** "20 de Out, 14:32", no fuso do aparelho. */
function formatarEnvio(data: Date) {
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");
    return `${formatDate(data)}, ${hora}:${minuto}`;
}
