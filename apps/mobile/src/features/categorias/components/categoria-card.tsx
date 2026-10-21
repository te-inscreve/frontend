import { Text, View } from "react-native";

import type { CategoriaPronta } from "../lib/listar-categorias-prontas";

/**
 * A categoria com o contexto que a lista precisa: a lista mistura eventos,
 * então o cartão mostra o evento e a modalidade abaixo do nome.
 */
export function CategoriaCard({ categoria }: { categoria: CategoriaPronta }) {
    return (
        <View className="bg-card border-border gap-1 rounded-xl border p-4">
            <Text
                role="heading"
                className="text-card-foreground text-base font-bold"
            >
                {categoria.nome}
            </Text>
            <Text className="text-muted-foreground text-sm">
                {categoria.eventoNome} · {categoria.modalidadeNome}
            </Text>
        </View>
    );
}

/** Tem a geometria do cartão: o nome e a linha de contexto. */
export function CategoriaCardSkeleton() {
    return (
        <View
            aria-hidden
            className="bg-card border-border gap-2 rounded-xl border p-4"
        >
            <View className="bg-muted h-5 w-2/3 rounded" />
            <View className="bg-muted h-4 w-1/2 rounded" />
        </View>
    );
}
