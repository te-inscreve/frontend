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
import { useCategoriasBaixadas } from "~/features/categorias/lib/use-categorias-baixadas";
import {
    useEstadoDownload,
    usePuxarDownload,
} from "~/features/categorias/lib/use-download";

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

/**
 * As categorias prontas para avaliação, do que o aparelho baixou (TE-107):
 * abrem sem rede. O download roda sozinho com rede; o pull-to-refresh baixa
 * de novo na hora.
 */
export default function Categorias() {
    const baixadas = useCategoriasBaixadas();
    const download = useEstadoDownload();
    const [busca, setBusca] = useState("");
    const { puxando, puxar } = usePuxarDownload();

    // Nada no aparelho ainda: o primeiro download está a caminho.
    if (!baixadas || (baixadas.length === 0 && download.baixando)) {
        return (
            <View className="gap-3 p-4">
                <Titulo />
                {[0, 1, 2, 3].map((posicao) => (
                    <CategoriaCardSkeleton key={posicao} />
                ))}
            </View>
        );
    }

    // Nunca baixou e a rede falhou: o erro ocupa o lugar da lista.
    if (baixadas.length === 0 && download.falhou) {
        return (
            <View className="flex-1 gap-4 p-4">
                <Titulo />
                <View className="flex-1 items-center justify-center gap-4">
                    <Mensagem>
                        Não foi possível baixar as categorias. Conecte-se à
                        internet uma vez para avaliar também sem ela.
                    </Mensagem>
                    <Button variant="outline" onPress={puxar}>
                        Tentar de novo
                    </Button>
                </View>
            </View>
        );
    }

    // A busca filtra o que está no aparelho: digitar não faz requisição.
    const encontradas = new Set(
        filtrarCategorias(
            baixadas.map(({ categoria }) => categoria),
            busca,
        ),
    );
    const visiveis = baixadas.filter(({ categoria }) =>
        encontradas.has(categoria),
    );
    const temCategorias = baixadas.length > 0;

    return (
        <FlatList
            data={visiveis}
            keyExtractor={({ categoria }) => String(categoria.id)}
            renderItem={({ item }) => (
                <CategoriaCard
                    categoria={item.categoria}
                    disponivelOffline={item.disponivelOffline}
                />
            )}
            contentContainerClassName="grow gap-3 p-4"
            // Com o teclado aberto, o primeiro toque no limpar já limpa, em
            // vez de só fechar o teclado.
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl refreshing={puxando} onRefresh={puxar} />
            }
            // Um elemento, não um componente: recriado a cada letra, o campo
            // seria montado de novo e perderia o foco.
            ListHeaderComponent={
                <View className="gap-3">
                    <View className="gap-0.5">
                        <Titulo />
                        <Text className="text-muted-foreground text-sm">
                            {rotuloQuantidadeCategorias(visiveis.length)}
                        </Text>
                    </View>
                    {download.baixando && !puxando ? (
                        <Text className="text-muted-foreground text-sm">
                            Baixando as categorias para avaliar sem rede…
                        </Text>
                    ) : download.falhou ? (
                        <Text className="text-muted-foreground text-sm">
                            Sem conexão com o servidor: mostrando o que já foi
                            baixado.
                        </Text>
                    ) : null}
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
