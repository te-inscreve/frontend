import { useMemo } from "react";
import { RefreshControl, SectionList, Text, View } from "react-native";

import { Button } from "~/components/ui/button";
import {
    AvaliacaoDoAparelho,
    CabecalhoSecaoMinhasAvaliacoes,
    MinhaAvaliacao,
    MinhaAvaliacaoSkeleton,
} from "~/features/avaliacoes/components/minha-avaliacao";
import { useAvaliacoesSalvas } from "~/features/avaliacoes/lib/avaliacoes-locais";
import {
    secoesComPendentes,
    useMinhasAvaliacoes,
} from "~/features/avaliacoes/lib/minhas-avaliacoes";
import { useSession } from "~/utils/auth";

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

function rotuloQuantidade(enviadas: number, pendentes: number) {
    const rotuloEnviadas =
        enviadas === 1
            ? "1 avaliação enviada"
            : `${enviadas} avaliações enviadas`;
    if (pendentes === 0) return rotuloEnviadas;
    return `${rotuloEnviadas} · ${pendentes} ainda no aparelho`;
}

/**
 * As avaliações do avaliador, por categoria: as que o servidor já aceitou e,
 * em cards tracejados no topo de cada categoria, as que ainda estão só no
 * aparelho (na fila, enviando ou com erro). Sem as pendentes, quem acabou de
 * salvar abriria a lista e não acharia a avaliação.
 */
export default function Avaliacoes() {
    const { data, isPending, isError, isRefetching, refetch } =
        useMinhasAvaliacoes();
    const { data: sessao } = useSession();
    const locais = useAvaliacoesSalvas(sessao?.user.id ?? "");
    // Sem o servidor (offline na abertura), as pendentes aparecem sozinhas.
    const secoes = useMemo(
        () => secoesComPendentes(data ?? [], locais ?? []),
        [data, locais],
    );
    const temPendentes = !!locais?.some(
        (local) => local.estado !== "sincronizada",
    );

    // Com pendentes, elas não esperam o servidor: offline, as novas
    // tentativas da consulta levariam segundos, e o avaliador acabou de
    // salvar. As enviadas carregam embaixo.
    if (!locais || (isPending && !temPendentes)) {
        return (
            <View className="gap-3 p-4">
                <Titulo />
                {[0, 1, 2, 3].map((posicao) => (
                    <MinhaAvaliacaoSkeleton key={posicao} />
                ))}
            </View>
        );
    }

    // Sem dados em cache, a rede falhou e nada pendente: o erro ocupa o
    // lugar da lista.
    if (isError && !data && !temPendentes) {
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

    const enviadas = secoes.reduce(
        (soma, secao) =>
            soma +
            secao.data.filter(
                (item) =>
                    item.tipo === "servidor" ||
                    item.avaliacao.estado === "sincronizada",
            ).length,
        0,
    );
    const pendentes = secoes.reduce(
        (soma, secao) =>
            soma +
            secao.data.filter(
                (item) =>
                    item.tipo === "local" &&
                    item.avaliacao.estado !== "sincronizada",
            ).length,
        0,
    );

    return (
        <SectionList
            sections={secoes}
            // Um card muda de lugar quando a avaliação sincroniza; com o
            // recorte de subviews do Android (padrão da lista), reordenar
            // derruba o app no Fabric ("child already has a parent"). A
            // lista é curta: sem recorte.
            removeClippedSubviews={false}
            keyExtractor={(item) => `${item.tipo}-${item.avaliacao.id}`}
            renderItem={({ item }) =>
                item.tipo === "local" ? (
                    <AvaliacaoDoAparelho avaliacao={item.avaliacao} />
                ) : (
                    <MinhaAvaliacao avaliacao={item.avaliacao} />
                )
            }
            renderSectionHeader={({ section }) => (
                <CabecalhoSecaoMinhasAvaliacoes secao={section} />
            )}
            ItemSeparatorComponent={Separador}
            ListFooterComponent={
                isPending ? (
                    <View className="gap-2 pt-2">
                        <MinhaAvaliacaoSkeleton />
                        <MinhaAvaliacaoSkeleton />
                    </View>
                ) : undefined
            }
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
                        {isPending
                            ? `${pendentes} ainda no aparelho`
                            : rotuloQuantidade(enviadas, pendentes)}
                    </Text>
                    {isError && !data && (
                        <View className="flex-row items-center justify-between gap-3 pt-2">
                            <Text className="text-muted-foreground shrink text-sm">
                                Não foi possível carregar as enviadas.
                            </Text>
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => void refetch()}
                            >
                                Tentar de novo
                            </Button>
                        </View>
                    )}
                </View>
            }
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                    <Mensagem>
                        Nenhuma avaliação ainda. As que você salvar aparecem
                        aqui, tracejadas até o servidor aceitá-las.
                    </Mensagem>
                </View>
            }
        />
    );
}

function Separador() {
    return <View className="h-2" />;
}
