import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";

import type { ResultadoCategoria } from "@te-inscreve/schemas";
import { cn } from "@te-inscreve/components";

import {
    formatarNota,
    hrefFichasDaInscricao,
} from "~/features/avaliacoes/avaliacao-preenchida/lib/avaliacoes-da-inscricao";
import { nomeDoClassificado } from "./lib/classificado";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    resultado: ResultadoCategoria;
    posicao: number | null;
}

/**
 * Uma linha da classificação. Com nota, ela leva às fichas preenchidas da
 * inscrição, todas na mesma tela, onde se escolhe qual inspecionar. Sem nota
 * não há ficha a ver, e a linha fica parada.
 */
export function LinhaClassificacao({
    eventoId,
    modalidadeId,
    categoriaId,
    resultado,
    posicao,
}: Props) {
    const nome = nomeDoClassificado(resultado);
    const entidade =
        nome !== resultado.nomeEntidade ? resultado.nomeEntidade : null;

    const conteudo = (
        <>
            <SeloPosicao posicao={posicao} />
            <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{nome}</span>
                {entidade && (
                    <span className="text-muted-foreground block truncate text-sm">
                        {entidade}
                    </span>
                )}
            </span>
        </>
    );

    if (resultado.notaFinal === null) {
        return (
            <article className="bg-card flex items-center gap-3 rounded-xl border p-3">
                {conteudo}
                <span className="text-muted-foreground text-sm">
                    Sem avaliação
                </span>
            </article>
        );
    }

    return (
        <Link
            href={hrefFichasDaInscricao({
                eventoId,
                modalidadeId,
                categoriaId,
                inscricaoId: resultado.id,
            })}
            className="bg-card hover:bg-accent/50 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl border p-3 transition-colors outline-none focus-visible:ring-[3px]"
        >
            {conteudo}
            <span className="flex shrink-0 flex-col items-end">
                <span className="text-muted-foreground text-xs">Nota</span>
                <span className="text-lg font-bold tabular-nums">
                    {formatarNota(resultado.notaFinal)}
                </span>
            </span>
            <CaretRightIcon
                aria-hidden="true"
                className="text-muted-foreground size-4 shrink-0"
            />
            <span className="sr-only">: ver as fichas avaliativas</span>
        </Link>
    );
}

/** O lugar na classificação: o primeiro em destaque, o pódio em tom mais claro. */
function SeloPosicao({ posicao }: { posicao: number | null }) {
    return (
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
    );
}
