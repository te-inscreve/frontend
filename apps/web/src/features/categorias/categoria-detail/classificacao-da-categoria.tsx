import { RankingIcon } from "@phosphor-icons/react/dist/ssr/Ranking";

import type { ResultadoCategoria } from "@te-inscreve/schemas";
import { cn } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";

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

/**
 * Quem se apresentou: a pessoa na individual; na em grupo, o nome de
 * concorrente ou, sem ele, a própria entidade.
 */
function nomeDoClassificado(resultado: ResultadoCategoria) {
    if (resultado.concorrente) {
        return `${resultado.concorrente.nome} ${resultado.concorrente.sobrenome}`;
    }
    if (resultado.nomeConcorrente) return resultado.nomeConcorrente;
    // `concorrente: null` é a individual sem integrante; sem a chave, é grupo.
    return resultado.concorrente === null
        ? "Concorrente não informado"
        : resultado.nomeEntidade;
}

/** `"9.3333"` → `"9,3333"`: a nota como veio, truncada, sem arredondar. */
const formatarNotaFinal = (nota: string) => nota.replace(".", ",");

function LinhaClassificacao({
    resultado,
    posicao,
}: {
    resultado: ResultadoCategoria;
    posicao: number | null;
}) {
    const nome = nomeDoClassificado(resultado);
    const mostraEntidade = nome !== resultado.nomeEntidade;

    return (
        <article className="bg-card flex items-center gap-3 rounded-xl border p-3">
            <span
                className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg text-base font-bold tabular-nums",
                    posicao === 1
                        ? "bg-primary text-primary-foreground"
                        : posicao !== null && posicao <= 3
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                )}
            >
                {posicao === null ? (
                    <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">Sem posição</span>
                    </>
                ) : (
                    <>
                        {posicao}º<span className="sr-only"> lugar</span>
                    </>
                )}
            </span>

            <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{nome}</h3>
                {mostraEntidade && (
                    <p className="text-muted-foreground truncate text-sm">
                        {resultado.nomeEntidade}
                    </p>
                )}
            </div>

            {resultado.notaFinal === null ? (
                <p className="text-muted-foreground text-sm">Sem avaliação</p>
            ) : (
                <p className="flex flex-col items-end">
                    <span className="text-muted-foreground text-xs">Nota</span>
                    <span className="text-lg font-bold tabular-nums">
                        {formatarNotaFinal(resultado.notaFinal)}
                    </span>
                </p>
            )}
        </article>
    );
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
