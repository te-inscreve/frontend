import { Text, View } from "react-native";

import type { SituacaoCategoria } from "@te-inscreve/schemas";

import { Dado } from "~/components/dado";
import { formatDate } from "~/utils/format-date";
import { SituacaoCategoriaBadge } from "./situacao-categoria-badge";

/**
 * O topo do detalhe da categoria, no lugar do título da barra: o nome com o
 * selo da situação, o evento embaixo, e a faixa etária, o início, o tipo da
 * modalidade e o modelo de ficha por último. Numa faixa `muted` de lado a lado, como o topo da ficha.
 */
export function CabecalhoCategoria({
    nome,
    eventoNome,
    modalidadeNome,
    idadeMinima,
    idadeMaxima,
    dataApresentacao,
    situacao,
    isGrupo,
    modeloFicha,
}: {
    nome: string;
    eventoNome: string;
    modalidadeNome: string;
    idadeMinima: number;
    idadeMaxima: number;
    /** ISO 8601; nulo quando a categoria ainda não está no cronograma. */
    dataApresentacao: string | null;
    situacao: SituacaoCategoria;
    isGrupo: boolean;
    /**
     * O que mostrar como modelo de ficha: o nome, ou a falta dele. Indefinido
     * enquanto carrega, e o lugar fica reservado.
     */
    modeloFicha?: string;
}) {
    return (
        <View className="bg-muted border-border gap-4 border-b px-4 pt-6 pb-5">
            <View className="gap-1">
                <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 flex-col gap-1">
                        <Text
                            role="heading"
                            className="text-foreground shrink text-2xl leading-tight font-bold tracking-tight"
                        >
                            {`${modalidadeNome} ${nome}`}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                            {`Evento: ${eventoNome}`}
                        </Text>
                    </View>
                    <SituacaoCategoriaBadge
                        situacao={situacao}
                        className="mt-1"
                    />
                </View>
            </View>

            <View className="flex-row gap-6">
                <Dado termo="Faixa etária">
                    {`${idadeMinima}-${idadeMaxima} anos`}
                </Dado>
                <Dado termo="Início em">
                    {dataApresentacao === null
                        ? "A definir"
                        : formatDate(new Date(dataApresentacao))}
                </Dado>
                <Dado termo="Modalidade">
                    {isGrupo ? "Grupo" : "Individual"}
                </Dado>
                {modeloFicha === undefined ? (
                    <View aria-hidden className="gap-0.5">
                        <Text className="text-muted-foreground text-sm">
                            Modelo de ficha
                        </Text>
                        {/* A altura da linha do valor (`text-base`). */}
                        <View className="bg-background my-0.5 h-5 w-48 rounded" />
                    </View>
                ) : (
                    <Dado termo="Modelo de ficha">{modeloFicha}</Dado>
                )}
            </View>
        </View>
    );
}
