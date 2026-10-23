import { Skeleton } from "@te-inscreve/components/components/skeleton";

import { DetalheModalidadeSkeleton } from "./detalhe-modalidade-skeleton";

/**
 * Espelha o layout de `DetalheEvento` para que a troca do fallback pelo
 * conteúdo real não empurre nada na página.
 */
export function DetalheEventoSkeleton() {
    return (
        <div aria-busy="true" aria-label="Carregando evento">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-2/3 max-w-md" />
                <Skeleton className="h-5 w-full max-w-2xl" />
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-40" />
                </div>
            </div>

            <Skeleton className="mt-4 h-7 w-56" />

            <div className="mt-4 flex gap-6 border-b pb-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-36" />
            </div>

            <div className="mt-4">
                <DetalheModalidadeSkeleton />
            </div>
        </div>
    );
}
