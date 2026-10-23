import { Skeleton } from "@te-inscreve/components/skeleton";

/** Quantas linhas o preview do painel mostra — as mesmas que o esqueleto ocupa. */
export const INTEGRANTES_NO_PAINEL = 5;

/**
 * A geometria da lista do painel enquanto a primeira página chega: avatar,
 * duas linhas de texto e a situação da matrícula à direita, mais o rodapé —
 * nas medidas da lista de verdade, para nada saltar quando ela chegar.
 */
export function ListaIntegrantesSkeleton() {
    return (
        <div className="bg-card divide-y overflow-hidden rounded-xl border">
            <ul className="divide-y">
                {Array.from({ length: INTEGRANTES_NO_PAINEL }, (_, indice) => (
                    <li key={indice} className="flex items-center gap-3 p-3">
                        <Skeleton className="size-9 shrink-0 rounded-full" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </li>
                ))}
            </ul>

            <div className="flex items-center justify-between gap-2 px-3 py-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}
