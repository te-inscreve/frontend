import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { ModeloAtual } from "~/features/avaliacoes/components/avaliacao-da-inscricao";
import type { ParametrosFichaInscricao } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import { AvaliacaoDaInscricao } from "~/features/avaliacoes/components/avaliacao-da-inscricao";
import { FolhaFichaSkeleton } from "~/features/avaliacoes/components/folha-ficha";
import { lerParametrosFichaInscricao } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import { trpc } from "~/utils/api";
import { useSession } from "~/utils/auth";

/**
 * A avaliação de uma inscrição. Todas as inscrições da categoria são julgadas
 * pelo mesmo modelo; a inscrição só identifica quem está sendo avaliado.
 *
 * O que vale é o que o aparelho guarda (TE-74): a avaliação atual abre com a
 * própria cópia do modelo, mesmo sem rede. O modelo atual da API só começa
 * uma avaliação nova e diz se a de agora ficou numa versão velha.
 */
export default function FichaInscricao() {
    const { inscricaoId, eventoId, modalidadeId, categoriaId, inscricao } =
        lerParametrosFichaInscricao(
            useLocalSearchParams<ParametrosFichaInscricao>(),
        );
    const { data: sessao } = useSession();
    const { data, isPending, isError, refetch } = useQuery(
        trpc.categoria.getFichaAvaliativa.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    const modeloAtual: ModeloAtual = data
        ? { tipo: "pronto", modelo: data }
        : isPending
          ? { tipo: "carregando" }
          : isError
            ? { tipo: "erro", tentarDeNovo: () => void refetch() }
            : { tipo: "sem-modelo" };

    return (
        <>
            {/* O nome do modelo vai para o topo da ficha; na barra, só o
                "Voltar". O `title` segue para leitores de tela. */}
            <Stack.Screen
                options={{ title: `Avaliar ${inscricao.concorrente}` }}
            />

            {/* A rota só existe com sessão (o guard do layout raiz); a
                espera é a do primeiro render. */}
            {sessao ? (
                <AvaliacaoDaInscricao
                    alvo={{
                        avaliadorId: sessao.user.id,
                        eventoId,
                        modalidadeId,
                        categoriaId,
                        inscricaoId,
                    }}
                    inscricao={inscricao}
                    modeloAtual={modeloAtual}
                />
            ) : (
                <FolhaFichaSkeleton />
            )}
        </>
    );
}
