import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { ParametrosFichaInscricao } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import { Button } from "~/components/ui/button";
import { FolhaFichaSkeleton } from "~/features/avaliacoes/components/folha-ficha";
import { FormularioFicha } from "~/features/avaliacoes/components/formulario-ficha";
import { lerParametrosFichaInscricao } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import { trpc } from "~/utils/api";

function Mensagem({ children }: { children: string }) {
    return (
        <Text className="text-muted-foreground text-center">{children}</Text>
    );
}

/**
 * A ficha de avaliação de uma inscrição, montada a partir do modelo vinculado
 * à categoria. Todas as inscrições da categoria são julgadas pelo mesmo
 * modelo; a inscrição só identifica quem está sendo avaliado.
 */
export default function FichaInscricao() {
    const { eventoId, modalidadeId, categoriaId, inscricao } =
        lerParametrosFichaInscricao(
            useLocalSearchParams<ParametrosFichaInscricao>(),
        );
    const { data, isPending, isError, refetch } = useQuery(
        trpc.categoria.getFichaAvaliativa.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    return (
        <>
            {/* O nome do modelo vai para o topo da ficha; na barra, só o
                "Voltar". O `title` segue para leitores de tela. */}
            <Stack.Screen
                options={{ title: `Avaliar ${inscricao.concorrente}` }}
            />

            {isPending ? (
                <FolhaFichaSkeleton />
            ) : isError && !data ? (
                // Sem modelo em cache e a rede falhou: o erro ocupa a tela.
                <View className="flex-1 items-center justify-center gap-4 p-4">
                    <Mensagem>
                        Não foi possível carregar a ficha. Verifique a conexão e
                        tente de novo.
                    </Mensagem>
                    <Button variant="outline" onPress={() => void refetch()}>
                        Tentar de novo
                    </Button>
                </View>
            ) : data ? (
                // A `key` remonta o formulário se o modelo trocar: os
                // `defaultValues` saem dele e só valem na montagem.
                <FormularioFicha
                    key={data.id}
                    modelo={data}
                    inscricao={inscricao}
                />
            ) : (
                <View className="flex-1 items-center justify-center p-4">
                    <Mensagem>
                        Esta categoria ainda não tem modelo de ficha. A
                        avaliação fica disponível quando a organização vincular
                        um.
                    </Mensagem>
                </View>
            )}
        </>
    );
}
