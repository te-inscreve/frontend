import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { InscricaoGrupo, InscricaoIndividual } from "@te-inscreve/schemas";

import type { ParametrosDetalheCategoria } from "~/features/categorias/lib/rota-detalhe-categoria";
import { Button } from "~/components/ui/button";
import {
    nomeDoConcorrente,
    rotaFichaInscricao,
} from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import {
    BilheteGrupo,
    BilheteGrupoSkeleton,
    BilheteIndividual,
    BilheteIndividualSkeleton,
} from "~/features/categorias/components/bilhete-inscricao";
import { CabecalhoCategoria } from "~/features/categorias/components/cabecalho-categoria";
import { lerParametrosDetalheCategoria } from "~/features/categorias/lib/rota-detalhe-categoria";
import { useInscricoesDaCategoria } from "~/features/categorias/lib/use-inscricoes-da-categoria";
import { trpc } from "~/utils/api";

function Mensagem({ children }: { children: string }) {
    return (
        <Text className="text-muted-foreground text-center">{children}</Text>
    );
}

export default function DetalheCategoria() {
    const categoria = lerParametrosDetalheCategoria(
        useLocalSearchParams<ParametrosDetalheCategoria>(),
    );
    const { categoriaId, eventoId, modalidadeId, isGrupo, nome, ...cabecalho } =
        categoria;
    const { data, isPending, isError, isRefetching, refetch } =
        useInscricoesDaCategoria({ eventoId, modalidadeId, categoriaId });

    // A mesma consulta da ficha: o nome do modelo vai ao cabeçalho, e a ficha
    // de qualquer inscrição já abre com o modelo em cache.
    const modelo = useQuery(
        trpc.categoria.getFichaAvaliativa.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    const modeloFicha = modelo.isPending
        ? undefined
        : modelo.isError && modelo.data === undefined
          ? "Não foi possível carregar"
          : (modelo.data?.nome ?? "Nenhum vinculado");

    const Skeleton = isGrupo ? BilheteGrupoSkeleton : BilheteIndividualSkeleton;

    return (
        <>
            {/* O nome vai para o cabeçalho abaixo; na barra, só o "Voltar". O
                `title` segue para leitores de tela. */}
            <Stack.Screen options={{ title: nome }} />
            <CabecalhoCategoria
                nome={nome}
                {...cabecalho}
                isGrupo={isGrupo}
                modeloFicha={modeloFicha}
            />

            {isPending ? (
                <View className="gap-3 p-4">
                    <View className="bg-muted h-5 w-24 rounded" />
                    {[0, 1, 2, 3].map((posicao) => (
                        <Skeleton key={posicao} />
                    ))}
                </View>
            ) : isError && !data ? (
                // Sem dados em cache e a rede falhou: o erro ocupa o lugar da lista.
                <View className="flex-1 items-center justify-center gap-4 p-4">
                    <Mensagem>
                        Não foi possível carregar as inscrições. Verifique a
                        conexão e tente de novo.
                    </Mensagem>
                    <Button variant="outline" onPress={() => void refetch()}>
                        Tentar de novo
                    </Button>
                </View>
            ) : (
                <FlatList<InscricaoGrupo | InscricaoIndividual>
                    data={data}
                    keyExtractor={(inscricao) => String(inscricao.id)}
                    renderItem={({ item }) => (
                        // O bilhete inteiro é o alvo: tocar nele abre a ficha
                        // daquela inscrição.
                        <Pressable
                            role="button"
                            aria-label={`Avaliar inscrição ${item.ordem},${nomeDoConcorrente(item)}`}
                            onPress={() =>
                                router.push(rotaFichaInscricao(categoria, item))
                            }
                            className="active:opacity-70"
                        >
                            {isGrupo ? (
                                <BilheteGrupo
                                    inscricao={item as InscricaoGrupo}
                                />
                            ) : (
                                <BilheteIndividual
                                    inscricao={item as InscricaoIndividual}
                                />
                            )}
                        </Pressable>
                    )}
                    contentContainerClassName="grow gap-3 p-4"
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => void refetch()}
                        />
                    }
                    ListHeaderComponent={
                        data.length > 0 ? (
                            <Text className="text-muted-foreground text-sm">
                                {data.length === 1
                                    ? "1 inscrição"
                                    : `${data.length} inscrições`}
                            </Text>
                        ) : undefined
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center">
                            <Mensagem>
                                Nenhuma inscrição nesta categoria ainda.
                            </Mensagem>
                        </View>
                    }
                />
            )}
        </>
    );
}
