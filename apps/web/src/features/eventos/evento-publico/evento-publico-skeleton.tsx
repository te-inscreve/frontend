import { Skeleton } from "@te-inscreve/components/skeleton";

/** Mesma grade de `EventoPublico`, para o cartaz não empurrar o texto. */
export function EventoPublicoSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando evento"
            className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12"
        >
            <Skeleton className="aspect-3/4 w-full rounded-xl" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-11 w-full" />
                    ))}
                </div>
                <Skeleton className="h-6 w-64" />
                <div className="flex gap-3 border-t pt-6">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>
        </div>
    );
}
