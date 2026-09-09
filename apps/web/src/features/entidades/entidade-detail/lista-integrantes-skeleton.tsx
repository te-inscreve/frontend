import { Skeleton } from "@te-inscreve/components/skeleton";

/** Quantas linhas o preview do painel mostra — as mesmas que o esqueleto ocupa. */
export const INTEGRANTES_NO_PAINEL = 5;

/**
 * A geometria da lista do painel enquanto a primeira página chega: avatar,
 * duas linhas de texto e a idade à direita, nas medidas da linha de verdade.
 */
export function ListaIntegrantesSkeleton() {
    return (
        <ul className="bg-card divide-y overflow-hidden rounded-xl border">
            {Array.from({ length: INTEGRANTES_NO_PAINEL }, (_, indice) => (
                <li key={indice} className="flex items-center gap-3 p-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                </li>
            ))}
        </ul>
    );
}
