import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";

import type { InscricaoGrupo, InscricaoIndividual } from "@te-inscreve/schemas";

import type { ParametrosDetalheCategoria } from "~/features/categorias/lib/rota-detalhe-categoria";
import { Button } from "~/components/ui/button";
import { useAvaliacaoAtual } from "~/features/avaliacoes/lib/avaliacoes-locais";
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
import { useSituacaoDaCategoria } from "~/features/categorias/lib/use-categorias-baixadas";
import { usePuxarDownload } from "~/features/categorias/lib/use-download";
import { useSession } from "~/utils/auth";

function Mensagem({ children }: { children: string }) {
    return (
        <Text className="text-muted-foreground text-center">{children}</Text>
    );
}

export default function DetalheCategoria() {
    const categoria = lerParametrosDetalheCategoria(
        useLocalSearchParams<ParametrosDetalheCategoria>(),
    );
    // As chaves da rota ficam fora do cabeçalho, que só mostra o resto.
    const {
        categoriaId,
        eventoId: _eventoId,
        modalidadeId: _modalidadeId,
        isGrupo,
        nome,
        ...cabecalho
    } = categoria;
    // O que o aparelho baixou (TE-107): abre sem rede.
    const situacao = useSituacaoDaCategoria(categoriaId);
    const { puxando, puxar } = usePuxarDownload();
    const inscricoes =
        situacao.tipo === "baixada"
            ? ordenarPorOrdem(situacao.download.inscricoes)
            : undefined;
    const modeloFicha =
        situacao.tipo === "baixada"
            ? (situacao.download.modelo?.nome ?? "Nenhum vinculado")
            : situacao.tipo === "nao-baixada"
              ? "Não baixado"
              : undefined;

    // A inscrição da avaliação atual ganha o "Continuar" no bilhete.
    const { data: sessao } = useSession();
    const avaliacaoAtual = useAvaliacaoAtual(sessao?.user.id ?? "");

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
                disponivelOffline={situacao.tipo === "baixada"}
            />

            {situacao.tipo === "carregando" ? (
                <View className="gap-3 p-4">
                    <View className="bg-muted h-5 w-24 rounded" />
                    {[0, 1, 2, 3].map((posicao) => (
                        <Skeleton key={posicao} />
                    ))}
                </View>
            ) : !inscricoes ? (
                // Sem download não há o que avaliar: as inscrições e o modelo
                // ainda não estão no aparelho.
                <View className="flex-1 items-center justify-center gap-4 p-4">
                    <Mensagem>
                        {situacao.tipo === "nao-baixada" && situacao.falhou
                            ? "Não foi possível baixar esta categoria. Tente de novo; depois de baixada, ela abre também sem rede."
                            : "Esta categoria ainda não foi baixada. Conecte-se à internet para baixar as inscrições e o modelo de ficha; depois ela abre também sem rede."}
                    </Mensagem>
                    <Button variant="outline" onPress={puxar}>
                        Baixar agora
                    </Button>
                </View>
            ) : (
                <FlatList<InscricaoGrupo | InscricaoIndividual>
                    data={inscricoes}
                    keyExtractor={(inscricao) => String(inscricao.id)}
                    renderItem={({ item }) => {
                        const atual = avaliacaoAtual?.inscricaoId === item.id;
                        return (
                            // O bilhete inteiro é o alvo: tocar nele abre a ficha
                            // daquela inscrição.
                            <Pressable
                                role="button"
                                aria-label={`${atual ? "Continuar avaliação da inscrição" : "Avaliar inscrição"} ${item.ordem},${nomeDoConcorrente(item)}`}
                                onPress={() =>
                                    router.push(
                                        rotaFichaInscricao(categoria, item),
                                    )
                                }
                                className="active:opacity-70"
                            >
                                {isGrupo ? (
                                    <BilheteGrupo
                                        inscricao={item as InscricaoGrupo}
                                        avaliacaoAtual={atual}
                                    />
                                ) : (
                                    <BilheteIndividual
                                        inscricao={item as InscricaoIndividual}
                                        avaliacaoAtual={atual}
                                    />
                                )}
                            </Pressable>
                        );
                    }}
                    contentContainerClassName="grow gap-3 p-4"
                    refreshControl={
                        <RefreshControl
                            refreshing={puxando}
                            onRefresh={puxar}
                        />
                    }
                    ListHeaderComponent={
                        inscricoes.length > 0 ? (
                            <Text className="text-muted-foreground text-sm">
                                {inscricoes.length === 1
                                    ? "1 inscrição"
                                    : `${inscricoes.length} inscrições`}
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

/**
 * As inscrições na ordem de apresentação (`ordem`), que é a ordem em que o
 * avaliador as encontra.
 */
function ordenarPorOrdem(inscricoes: (InscricaoGrupo | InscricaoIndividual)[]) {
    return [...inscricoes].sort((a, b) => a.ordem - b.ordem);
}
