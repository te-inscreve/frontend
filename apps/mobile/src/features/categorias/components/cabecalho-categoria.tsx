import { Text, View } from "react-native";

import type { SituacaoCategoria } from "@te-inscreve/schemas";

import { formatDate } from "~/utils/format-date";
import { SituacaoCategoriaBadge } from "./situacao-categoria-badge";

/**
 * O topo do detalhe da categoria, no lugar do título da barra: o nome com o
 * selo da situação, evento e modalidade embaixo, e a faixa etária e o início
 * por último. Numa faixa `muted` de lado a lado, como o topo da ficha.
 */
export function CabecalhoCategoria({
    nome,
    eventoNome,
    modalidadeNome,
    idadeMinima,
    idadeMaxima,
    dataApresentacao,
    situacao,
}: {
    nome: string;
    eventoNome: string;
    modalidadeNome: string;
    idadeMinima: number;
    idadeMaxima: number;
    /** ISO 8601; nulo quando a categoria ainda não está no cronograma. */
    dataApresentacao: string | null;
    situacao: SituacaoCategoria;
}) {
    return (
        <View className="bg-muted border-border gap-4 border-b px-4 pt-6 pb-5">
            <View className="gap-1">
                <View className="flex-row items-start justify-between gap-3">
                    <Text
                        role="heading"
                        className="text-foreground shrink text-2xl leading-tight font-bold tracking-tight"
                    >
                        {`${modalidadeNome} ${nome}`}
                    </Text>
                    <SituacaoCategoriaBadge
                        situacao={situacao}
                        className="mt-1"
                    />
                </View>
            </View>

            <Dado termo="Evento">{eventoNome}</Dado>
            <View className="flex-row gap-6">
                <Dado termo="Faixa etária">
                    {`${idadeMinima}-${idadeMaxima} anos`}
                </Dado>
                <Dado termo="Início em">
                    {dataApresentacao === null
                        ? "A definir"
                        : formatDate(new Date(dataApresentacao))}
                </Dado>
            </View>
        </View>
    );
}

function Dado({ termo, children }: { termo: string; children: string }) {
    return (
        <View className="gap-0.5">
            <Text className="text-muted-foreground text-sm">{termo}</Text>
            <Text className="text-foreground text-base font-semibold">
                {children}
            </Text>
        </View>
    );
}
