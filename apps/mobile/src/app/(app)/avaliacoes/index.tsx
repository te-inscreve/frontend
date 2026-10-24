import { RefreshControl, SectionList, Text, View } from "react-native";

import { Button } from "~/components/ui/button";
import {
    CabecalhoSecaoMinhasAvaliacoes,
    MinhaAvaliacao,
    MinhaAvaliacaoSkeleton,
} from "~/features/avaliacoes/components/minha-avaliacao";
import { useMinhasAvaliacoes } from "~/features/avaliacoes/lib/minhas-avaliacoes";

function Mensagem({ children }: { children: string }) {
    return (
        <Text className="text-muted-foreground text-center">{children}</Text>
    );
}

function Titulo() {
    return (
        <Text
            role="heading"
            className="text-foreground text-3xl leading-tight font-bold"
        >
            Minhas Avaliações
        </Text>
    );
}

function rotuloQuantidade(quantidade: number) {
    return quantidade === 1
        ? "1 avaliação enviada"
        : `${quantidade} avaliações enviadas`;
}

/**
 * O histórico do avaliador: as avaliações que o servidor já aceitou, por
 * categoria. As que ainda estão no aparelho ficam na fila, no cabeçalho.
 */
export default function Avaliacoes() {
    const { data, isPending, isError, isRefetching, refetch } =
        useMinhasAvaliacoes();

    if (isPending) {
        return (
            <View className="gap-3 p-4">
                <Titulo />
                {[0, 1, 2, 3].map((posicao) => (
                    <MinhaAvaliacaoSkeleton key={posicao} />
                ))}
            </View>
        );
    }

    // Sem dados em cache e a rede falhou: o erro ocupa o lugar da lista.
    if (isError && !data) {
        return (
            <View className="flex-1 gap-4 p-4">
                <Titulo />
                <View className="flex-1 items-center justify-center gap-4">
                    <Mensagem>
                        Não foi possível carregar suas avaliações. Verifique a
                        conexão e tente de novo.
                    </Mensagem>
                    <Button variant="outline" onPress={() => void refetch()}>
                        Tentar de novo
                    </Button>
                </View>
            </View>
        );
    }

    const total = data.reduce((soma, secao) => soma + secao.data.length, 0);

    return (
        <SectionList
            sections={data}
            keyExtractor={(avaliacao) => String(avaliacao.id)}
            renderItem={({ item }) => <MinhaAvaliacao avaliacao={item} />}
            renderSectionHeader={({ section }) => (
                <CabecalhoSecaoMinhasAvaliacoes secao={section} />
            )}
            ItemSeparatorComponent={Separador}
            contentContainerClassName="grow px-4 pb-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => void refetch()}
                />
            }
            ListHeaderComponent={
                <View className="gap-0.5 pt-4">
                    <Titulo />
                    <Text className="text-muted-foreground text-sm">
                        {rotuloQuantidade(total)}
                    </Text>
                </View>
            }
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                    <Mensagem>
                        Nenhuma avaliação enviada ainda. As que você salvar
                        aparecem aqui quando o servidor as aceitar.
                    </Mensagem>
                </View>
            }
        />
    );
}

function Separador() {
    return <View className="h-2" />;
}
