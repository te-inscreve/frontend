import { useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";

import { Button } from "~/components/ui/button";
import { BuscaCategorias } from "~/features/categorias/components/busca-categorias";
import {
    CategoriaCard,
    CategoriaCardSkeleton,
} from "~/features/categorias/components/categoria-card";
import {
    filtrarCategorias,
    rotuloQuantidadeCategorias,
} from "~/features/categorias/lib/filtrar-categorias";
import { useCategoriasProntas } from "~/features/categorias/lib/use-categorias-prontas";

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
            Categorias para Avaliar
        </Text>
    );
}

export default function Categorias() {
    const { data, isPending, isError, isRefetching, refetch } =
        useCategoriasProntas();
    const [busca, setBusca] = useState("");

    if (isPending) {
        return (
            <View className="gap-3 p-4">
                <Titulo />
                {[0, 1, 2, 3].map((posicao) => (
                    <CategoriaCardSkeleton key={posicao} />
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
                        Não foi possível carregar as categorias. Verifique a
                        conexão e tente de novo.
                    </Mensagem>
                    <Button variant="outline" onPress={() => void refetch()}>
                        Tentar de novo
                    </Button>
                </View>
            </View>
        );
    }

    // A busca filtra o que já chegou: digitar não faz requisição nova.
    const encontradas = filtrarCategorias(data, busca);
    const temCategorias = data.length > 0;

    return (
        <FlatList
            data={encontradas}
            keyExtractor={(categoria) => String(categoria.id)}
            renderItem={({ item }) => <CategoriaCard categoria={item} />}
            contentContainerClassName="grow gap-3 p-4"
            // Com o teclado aberto, o primeiro toque no limpar já limpa, em
            // vez de só fechar o teclado.
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => void refetch()}
                />
            }
            // Um elemento, não um componente: recriado a cada letra, o campo
            // seria montado de novo e perderia o foco.
            ListHeaderComponent={
                <View className="gap-3">
                    <View className="gap-0.5">
                        <Titulo />
                        <Text className="text-muted-foreground text-sm">
                            {rotuloQuantidadeCategorias(encontradas.length)}
                        </Text>
                    </View>
                    {/* Sem categorias não há o que buscar. */}
                    {temCategorias ? (
                        <BuscaCategorias valor={busca} onChange={setBusca} />
                    ) : null}
                </View>
            }
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                    <Mensagem>
                        {temCategorias
                            ? "Nenhuma categoria encontrada para essa busca."
                            : "Nenhuma categoria liberada para avaliação no momento."}
                    </Mensagem>
                </View>
            }
        />
    );
}
