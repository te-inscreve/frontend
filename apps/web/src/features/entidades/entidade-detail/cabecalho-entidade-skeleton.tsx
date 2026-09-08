import { Skeleton } from "@te-inscreve/components/components/skeleton";

/** Ocupa o mesmo espaço do cabeçalho enquanto a entidade não chega. */
export function CabecalhoEntidadeSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando entidade"
            className="flex flex-col gap-4"
        >
            <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="size-16 shrink-0 rounded-xl" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-9 w-72" />
                    <Skeleton className="h-5 w-40 rounded-full" />
                </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-5 w-32" />
                ))}
            </div>
        </div>
    );
}
