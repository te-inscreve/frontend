import { Stack, useLocalSearchParams } from "expo-router";

import type { ModeloAtual } from "~/features/avaliacoes/components/avaliacao-da-inscricao";
import type { ParametrosFichaInscricao } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import { opcoesComVoltarPara } from "~/components/botao-voltar";
import { AvaliacaoDaInscricao } from "~/features/avaliacoes/components/avaliacao-da-inscricao";
import { FolhaFichaSkeleton } from "~/features/avaliacoes/components/folha-ficha";
import { lerParametrosFichaInscricao } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import {
    useSaidasDaFicha,
    useVoltarDoSistema,
} from "~/features/avaliacoes/lib/use-saidas-da-ficha";
import { useSituacaoDaCategoria } from "~/features/categorias/lib/use-categorias-baixadas";
import { atualizarDownload } from "~/features/categorias/lib/use-download";
import { useSession } from "~/utils/auth";

/**
 * A avaliação de uma inscrição. Todas as inscrições da categoria são julgadas
 * pelo mesmo modelo; a inscrição só identifica quem está sendo avaliado.
 *
 * O que vale é o que o aparelho guarda (TE-74): a avaliação atual abre com a
 * própria cópia do modelo, mesmo sem rede. O modelo baixado da categoria
 * (TE-107) começa uma avaliação nova, também sem rede, e diz se a de agora
 * ficou numa versão velha.
 */
export default function FichaInscricao() {
    const {
        origem,
        inscricaoId,
        eventoId,
        modalidadeId,
        categoriaId,
        inscricao,
    } = lerParametrosFichaInscricao(
        useLocalSearchParams<ParametrosFichaInscricao>(),
    );
    const { data: sessao } = useSession();
    const { voltar } = useSaidasDaFicha(categoriaId, origem);
    useVoltarDoSistema(voltar);
    const situacao = useSituacaoDaCategoria(categoriaId);

    const modeloAtual: ModeloAtual =
        situacao.tipo === "carregando"
            ? { tipo: "carregando" }
            : situacao.tipo === "nao-baixada"
              ? { tipo: "nao-baixado", baixar: () => void atualizarDownload() }
              : situacao.download.modelo
                ? { tipo: "pronto", modelo: situacao.download.modelo }
                : { tipo: "sem-modelo" };

    return (
        <>
            {/* O nome do modelo vai para o topo da ficha; na barra, só o
                "Voltar", que leva para onde a ficha foi aberta. O `title` segue
                para leitores de tela. */}
            <Stack.Screen
                options={{
                    title: `Avaliar ${inscricao.concorrente}`,
                    ...opcoesComVoltarPara(voltar),
                }}
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
                    origem={origem}
                />
            ) : (
                <FolhaFichaSkeleton />
            )}
        </>
    );
}
