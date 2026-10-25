import { RankingIcon } from "@phosphor-icons/react/dist/ssr/Ranking";

import type { ResultadoCategoria } from "@te-inscreve/schemas";
import { Skeleton } from "@te-inscreve/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { LinhaClassificacao } from "./linha-classificacao";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    encerrada: boolean;
}

/**
 * A aba de classificações da categoria.
 *
 * Server Component atrás do seu próprio `<Suspense>`: o `fetchQuery`
 * reaproveita o `prefetch` da página. A lista vazia não distingue categoria
 * aberta de categoria sem inscrições, então quem decide o aviso é a
 * `situacao` — o resultado só é divulgado depois de encerrada.
 *
 * Cada linha se expande nas avaliações da inscrição, e cada avaliação leva à
 * ficha preenchida.
 */
export async function ClassificacaoDaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
    encerrada,
}: Props) {
    const resultados = await getQueryClient().fetchQuery(
        trpc.categoria.getResultados.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    if (!encerrada) {
        return (
            <ClassificacaoVazia
                titulo="Resultados ainda não divulgados"
                descricao="A classificação aparece aqui quando a categoria for encerrada."
            />
        );
    }
    if (resultados.length === 0) {
        return (
            <ClassificacaoVazia
                titulo="Nenhuma inscrição classificada"
                descricao="A categoria foi encerrada sem inscrições ativas."
            />
        );
    }

    const posicoes = posicoesComEmpate(resultados);

    return (
        <ol className="flex flex-col gap-2">
            {resultados.map((resultado, indice) => (
                <li key={resultado.id}>
                    <LinhaClassificacao
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        categoriaId={categoriaId}
                        resultado={resultado}
                        posicao={posicoes[indice] ?? null}
                    />
                </li>
            ))}
        </ol>
    );
}

/**
 * A posição de cada linha, na ordem que o backend mandou. Notas iguais dividem
 * a posição e pulam as seguintes (1º, 1º, 3º); sem nota, não há posição.
 *
 * A comparação é entre as strings: as duas vêm truncadas com as mesmas 4
 * casas, então igualdade de texto é igualdade de nota, sem ponto flutuante.
 */
function posicoesComEmpate(resultados: ResultadoCategoria[]) {
    return resultados.map(({ notaFinal }) => {
        if (notaFinal === null) return null;
        const primeira = resultados.findIndex(
            (outro) => outro.notaFinal === notaFinal,
        );
        return primeira + 1;
    });
}

function ClassificacaoVazia({
    titulo,
    descricao,
}: {
    titulo: string;
    descricao: string;
}) {
    return (
        <div className="bg-card flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
            <RankingIcon
                aria-hidden="true"
                className="text-muted-foreground size-10"
                weight="duotone"
            />
            <p className="font-medium">{titulo}</p>
            <p className="text-muted-foreground max-w-xs text-sm">
                {descricao}
            </p>
        </div>
    );
}

/** A {@link ClassificacaoDaCategoria} enquanto a resposta não chega. */
export function ClassificacaoDaCategoriaSkeleton() {
    return (
        <ol aria-hidden="true" className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((indice) => (
                <li
                    key={indice}
                    className="bg-card flex items-center gap-3 rounded-xl border p-3"
                >
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-7 w-16" />
                </li>
            ))}
        </ol>
    );
}
