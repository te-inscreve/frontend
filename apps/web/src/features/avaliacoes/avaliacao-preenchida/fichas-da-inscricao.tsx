import { notFound } from "next/navigation";

import type { ModeloFichaDetalhe } from "@te-inscreve/schemas";
import { Skeleton } from "@te-inscreve/components/skeleton";

import type { FichaDaBancada } from "./bancada-fichas";
import type { CaminhoDaInscricao } from "./lib/avaliacoes-da-inscricao";
import { nomeDoClassificado } from "~/features/categorias/categoria-detail/lib/classificado";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { BancadaFichas } from "./bancada-fichas";
import {
    daCategoria,
    formatarNota,
    nomeDoAvaliador,
    ordenarAvaliacoes,
} from "./lib/avaliacoes-da-inscricao";
import { fichaPreenchida } from "./lib/ficha-preenchida";

/**
 * As fichas preenchidas de uma inscrição, todas na mesma tela: quem foi
 * avaliado, a nota final e a {@link BancadaFichas}, onde se escolhe qual
 * inspecionar.
 *
 * Server Component atrás do seu próprio `<Suspense>`. A lista, a
 * classificação e a ficha da categoria vêm dos `prefetch` da página; os
 * detalhes dependem da lista, e os modelos, dos detalhes. Cada espera em série
 * vai em paralelo dentro dela, e o modelo só é pedido quando a avaliação usou
 * outra versão que não a vinculada à categoria hoje.
 */
export async function FichasDaInscricao({
    caminho,
}: {
    caminho: CaminhoDaInscricao;
}) {
    const queryClient = getQueryClient();
    const [avaliacoes, resultados, fichaDaCategoria, categoria, evento] =
        await Promise.all([
            queryClient.fetchQuery(
                trpc.avaliacao.getDaInscricao.queryOptions(caminho),
            ),
            queryClient.fetchQuery(
                trpc.categoria.getResultados.queryOptions(daCategoria(caminho)),
            ),
            queryClient.fetchQuery(
                trpc.categoria.getFichaAvaliativa.queryOptions(
                    daCategoria(caminho),
                ),
            ),
            // Os dois só dão nome à categoria no pé de cada folha; a trilha já
            // os pediu, é a mesma requisição.
            queryClient.fetchQuery(
                trpc.categoria.getById.queryOptions(daCategoria(caminho)),
            ),
            queryClient.fetchQuery(
                trpc.evento.getById.queryOptions({ id: caminho.eventoId }),
            ),
        ]);

    const ordenadas = ordenarAvaliacoes(avaliacoes);
    const detalhes = await Promise.all(
        ordenadas.map(({ id }) =>
            queryClient.fetchQuery(
                trpc.avaliacao.getById.queryOptions({
                    ...caminho,
                    avaliacaoId: id,
                }),
            ),
        ),
    );

    const modelos = new Map<number, ModeloFichaDetalhe>();
    if (fichaDaCategoria) modelos.set(fichaDaCategoria.id, fichaDaCategoria);
    const faltando = new Set(
        detalhes.flatMap((detalhe) =>
            detalhe && !modelos.has(detalhe.modeloFichaAvaliativaId)
                ? [detalhe.modeloFichaAvaliativaId]
                : [],
        ),
    );
    await Promise.all(
        [...faltando].map(async (id) => {
            modelos.set(
                id,
                await queryClient.fetchQuery(
                    trpc.fichaAvaliativa.getById.queryOptions({ id }),
                ),
            );
        }),
    );

    const fichas = detalhes.flatMap((detalhe, indice): FichaDaBancada[] => {
        const modelo = detalhe && modelos.get(detalhe.modeloFichaAvaliativaId);
        if (!detalhe || !modelo) return [];
        return [
            {
                id: detalhe.id,
                numero: indice + 1,
                avaliador: nomeDoAvaliador(detalhe.avaliador),
                nota: detalhe.nota,
                dataEnvio: detalhe.dataEnvio,
                modelo: { nome: modelo.nome, versao: modelo.versao },
                itens: fichaPreenchida(modelo, detalhe),
            },
        ];
    });

    const resultado = resultados.find(({ id }) => id === caminho.inscricaoId);
    // Sem avaliação e sem lugar na classificação, não há o que mostrar: é
    // link para inscrição de outra categoria, ou que não existe.
    if (fichas.length === 0 && !resultado) notFound();

    const nome = resultado
        ? nomeDoClassificado(resultado)
        : `Inscrição ${caminho.inscricaoId}`;
    const entidade =
        resultado && nome !== resultado.nomeEntidade
            ? resultado.nomeEntidade
            : null;

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end gap-x-6 gap-y-2">
                <div className="mr-auto min-w-0">
                    <h1 className="text-primary text-4xl font-bold break-words">
                        {nome}
                    </h1>
                    {entidade && (
                        <p className="text-muted-foreground">{entidade}</p>
                    )}
                </div>
                {resultado?.notaFinal && (
                    <p className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs">
                            Nota final · média de {fichas.length}{" "}
                            {fichas.length === 1 ? "avaliação" : "avaliações"}
                        </span>
                        <span className="text-3xl font-bold tabular-nums">
                            {formatarNota(resultado.notaFinal)}
                        </span>
                    </p>
                )}
            </header>

            {fichas.length === 0 ? (
                <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-8 text-center text-sm">
                    Nenhuma avaliação enviada para esta inscrição.
                </p>
            ) : (
                <BancadaFichas
                    fichas={fichas}
                    categoria={nomeDaCategoria(
                        evento?.modalidades.find(
                            ({ id }) => id === caminho.modalidadeId,
                        )?.nome,
                        categoria?.nome,
                    )}
                />
            )}
        </div>
    );
}

/** `"Chula - Mirim"`, como o título do detalhe da categoria. */
function nomeDaCategoria(modalidade?: string, categoria?: string) {
    return [modalidade, categoria].filter(Boolean).join(" - ") || null;
}

/** O cabeçalho e as pranchetas enquanto as fichas não chegam. */
export function FichasDaInscricaoSkeleton() {
    return (
        <div aria-hidden="true" className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((indice) => (
                    <Skeleton
                        key={indice}
                        className="mt-2.5 aspect-3/4 w-full rounded-xl"
                    />
                ))}
            </div>
        </div>
    );
}
