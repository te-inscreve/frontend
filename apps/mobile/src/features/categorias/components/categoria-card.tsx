import { Text, View } from "react-native";

import type { CategoriaPronta } from "../lib/listar-categorias-prontas";
import { formatDate } from "~/utils/format-date";
import { SituacaoCategoriaBadge } from "./situacao-categoria-badge";

/**
 * O `CardCategoria` do web em forma de ingresso: a borda é o fundo da camada
 * externa, e o canhoto com a faixa etária e o miolo ficam dentro dela.
 *
 * Diferente do web, ocupa a largura da lista e mostra evento e modalidade
 * abaixo do nome, porque a lista do mobile mistura eventos.
 */
export function CategoriaCard({ categoria }: { categoria: CategoriaPronta }) {
    return (
        <View className="bg-border flex-row rounded-xl p-px">
            <CanhotoIdade categoria={categoria} />

            <View className="bg-card flex-1 gap-2 overflow-hidden rounded-r-xl p-2">
                <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 gap-0.5">
                        <Text
                            role="heading"
                            className="text-card-foreground text-base leading-tight font-bold"
                        >
                            {categoria.nome}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                            {categoria.eventoNome} · {categoria.modalidadeNome}
                        </Text>
                    </View>
                    <SituacaoCategoriaBadge situacao={categoria.situacao} />
                </View>

                <View className="flex-row gap-2">
                    <Dado
                        termo="Inscrições"
                        // Nulo é categoria sem teto, e não zero inscrições.
                        valor={
                            categoria.maxInscricoes === null
                                ? categoria.countInscricoes.toString()
                                : `${categoria.countInscricoes} / ${categoria.maxInscricoes}`
                        }
                    />
                    <Dado
                        termo="Início em"
                        // Nulo é categoria ainda fora do cronograma.
                        valor={
                            categoria.dataApresentacao === null
                                ? null
                                : formatDate(
                                      new Date(categoria.dataApresentacao),
                                  )
                        }
                    />
                </View>
            </View>
        </View>
    );
}

/** A faixa à esquerda com a faixa etária, como o canhoto de um ingresso. */
function CanhotoIdade({ categoria }: { categoria: CategoriaPronta }) {
    return (
        <View className="bg-muted items-center justify-center rounded-l-xl px-3">
            <Text className="text-muted-foreground text-base font-bold tracking-wider">
                {categoria.idadeMinima}-{categoria.idadeMaxima}
            </Text>
            <Text className="text-muted-foreground text-sm">Anos</Text>
        </View>
    );
}

function Dado({ termo, valor }: { termo: string; valor: string | null }) {
    return (
        <View className="bg-muted flex-1 items-center justify-center rounded-md px-2 py-2">
            <Text className="text-muted-foreground text-sm">{termo}</Text>
            <Text numberOfLines={1} className="text-foreground text-sm">
                {valor ?? "A definir"}
            </Text>
        </View>
    );
}

/**
 * Tem a geometria do cartão: o canhoto, o cabeçalho com nome, contexto e selo,
 * e as duas células de dados.
 */
export function CategoriaCardSkeleton() {
    return (
        <View aria-hidden className="bg-border flex-row rounded-xl p-px">
            {/* A largura do "10-14" sobre "Anos" com o `px-3` do canhoto. */}
            <View className="bg-muted w-16 rounded-l-xl" />

            <View className="bg-card flex-1 gap-2 rounded-r-xl p-2">
                <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 gap-1">
                        <View className="bg-muted h-5 w-2/3 rounded" />
                        <View className="bg-muted h-4 w-1/2 rounded" />
                    </View>
                    <View className="bg-muted h-5.5 w-24 rounded-sm" />
                </View>

                <View className="flex-row gap-2">
                    <View className="bg-muted h-14 flex-1 rounded-md" />
                    <View className="bg-muted h-14 flex-1 rounded-md" />
                </View>
            </View>
        </View>
    );
}
