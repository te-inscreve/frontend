import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import type { CategoriaPronta } from "../lib/listar-categorias-prontas";
import { formatDate } from "~/utils/format-date";
import { rotaDetalheCategoria } from "../lib/rota-detalhe-categoria";
import { TipoModalidade } from "./tipo-modalidade";

/**
 * O `CardCategoria` do web em forma de ingresso: a borda é o fundo da camada
 * externa, e o canhoto com a faixa etária e o miolo ficam dentro dela.
 *
 * Diferente do web, ocupa a largura da lista e mostra a modalidade ao lado do
 * nome e o evento abaixo, porque a lista do mobile mistura eventos. Sem selo
 * de situação: a lista só tem categorias prontas para avaliação. O ícone no
 * canto diz se a modalidade é individual ou em grupo. O toque empilha o detalhe da categoria
 * na aba.
 */
export function CategoriaCard({ categoria }: { categoria: CategoriaPronta }) {
    return (
        <Link href={rotaDetalheCategoria(categoria)} asChild>
            <Pressable className="bg-border flex-row rounded-xl p-px active:opacity-80">
                <CanhotoIdade categoria={categoria} />

                <View className="bg-card flex-1 gap-2 overflow-hidden rounded-r-xl p-2">
                    <View className="flex-row items-start gap-2">
                        <View className="flex-1 gap-0.5">
                            <Text
                                role="heading"
                                className="text-card-foreground text-base leading-tight font-bold"
                            >
                                {`${categoria.modalidadeNome} ${categoria.nome}`}
                            </Text>
                            <Text className="text-muted-foreground text-sm">
                                {categoria.eventoNome}
                            </Text>
                        </View>
                        <TipoModalidade isGrupo={categoria.isGrupo} />
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
            </Pressable>
        </Link>
    );
}

/**
 * A faixa à esquerda com a faixa etária, como o canhoto de um ingresso. A
 * largura é fixa para os cartões alinharem, e cabe "12-17", a mais larga.
 */
function CanhotoIdade({ categoria }: { categoria: CategoriaPronta }) {
    return (
        <View className="bg-muted w-20 items-center justify-center rounded-l-xl">
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
 * Tem a geometria do cartão: o canhoto, o cabeçalho com nome e contexto, e
 * as duas células de dados.
 */
export function CategoriaCardSkeleton() {
    return (
        <View aria-hidden className="bg-border flex-row rounded-xl p-px">
            {/* A mesma largura fixa do canhoto. */}
            <View className="bg-muted w-20 rounded-l-xl" />

            <View className="bg-card flex-1 gap-2 rounded-r-xl p-2">
                <View className="gap-1">
                    <View className="bg-muted h-5 w-2/3 rounded" />
                    <View className="bg-muted h-4 w-1/2 rounded" />
                </View>

                <View className="flex-row gap-2">
                    <View className="bg-muted h-14 flex-1 rounded-md" />
                    <View className="bg-muted h-14 flex-1 rounded-md" />
                </View>
            </View>
        </View>
    );
}
