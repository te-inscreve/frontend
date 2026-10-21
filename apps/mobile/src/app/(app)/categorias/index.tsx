import { FlatList, RefreshControl, Text, View } from "react-native";

import { Button } from "~/components/ui/button";
import {
    CategoriaCard,
    CategoriaCardSkeleton,
} from "~/features/categorias/components/categoria-card";
import { useCategoriasProntas } from "~/features/categorias/lib/use-categorias-prontas";

function Mensagem({ children }: { children: string }) {
    return (
        <Text className="text-muted-foreground text-center">{children}</Text>
    );
}

export default function Categorias() {
    const { data, isPending, isError, isRefetching, refetch } =
        useCategoriasProntas();

    if (isPending) {
        return (
            <View className="gap-3 p-4">
                {[0, 1, 2, 3].map((posicao) => (
                    <CategoriaCardSkeleton key={posicao} />
                ))}
            </View>
        );
    }

    // Sem dados em cache e a rede falhou: o erro ocupa o lugar da lista.
    if (isError && !data) {
        return (
            <View className="flex-1 items-center justify-center gap-4 p-4">
                <Mensagem>
                    Não foi possível carregar as categorias. Verifique a conexão
                    e tente de novo.
                </Mensagem>
                <Button variant="outline" onPress={() => void refetch()}>
                    Tentar de novo
                </Button>
            </View>
        );
    }

    return (
        <FlatList
            data={data}
            keyExtractor={(categoria) => String(categoria.id)}
            renderItem={({ item }) => <CategoriaCard categoria={item} />}
            contentContainerClassName="grow gap-3 p-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => void refetch()}
                />
            }
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                    <Mensagem>
                        Nenhuma categoria liberada para avaliação no momento.
                    </Mensagem>
                </View>
            }
        />
    );
}
