import { Skeleton } from "@te-inscreve/components/skeleton";

import { LadoDaBancada } from "~/features/entidades/grupos/bancada";
import { CartaoGrupoSkeleton } from "~/features/entidades/grupos/cartao-grupo-skeleton";
import { TicketInscricaoSkeleton } from "./ticket-inscricao";

/** Quantos cartões-esqueleto na coluna da esquerda: uma coluna cheia. */
const ESQUELETOS = 4;

/**
 * O fallback do portão da entidade na página de Criar Inscrição.
 *
 * Tem a geometria final da {@link BancadaInscricao} — a mesma grade, a
 * moldura da esquerda com título, descrição, abas e barra em esqueleto, e o
 * bilhete da direita em esqueleto —, para que nada pule quando o portão
 * decidir. Cobre a bancada inteira, e não uma parte, porque o portão decide
 * se ela existe (a exceção 2 de `docs/fcp.md`); a trilha e o título da
 * página ficam fora dele e pintam na hora.
 */
export function BancadaInscricaoSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando a bancada de inscrição"
            className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch xl:grid-cols-[22rem_auto_minmax(0,1fr)]"
        >
            <LadoDaBancada
                titulo={<Skeleton className="h-5 w-40" />}
                descricao={<Skeleton className="h-3 w-56" />}
                abas={
                    <div className="flex h-9 items-center gap-4 px-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                }
                className="order-2 min-h-0 lg:order-1"
            >
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full max-w-xs" />
                    <Skeleton className="h-4 w-20" />
                </div>

                <ul className="grid gap-3">
                    {Array.from({ length: ESQUELETOS }, (_, indice) => (
                        <CartaoGrupoSkeleton key={indice} />
                    ))}
                </ul>
            </LadoDaBancada>

            <span
                aria-hidden="true"
                className="border-border/70 hidden border-l border-dashed lg:order-2 lg:block"
            />

            <TicketInscricaoSkeleton className="order-1 lg:order-3" />
        </div>
    );
}
