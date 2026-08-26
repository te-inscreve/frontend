import { Skeleton } from "@te-inscreve/components/components/skeleton";

/** Ocupa o mesmo espaço do painel da aba enquanto a modalidade não chega. */
export function DetalheModalidadeSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando modalidade"
            className="flex flex-col gap-4"
        >
            <div className="flex flex-col gap-4 rounded-lg border p-4 md:p-5">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-full max-w-2xl" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-15" />
                    ))}
                </div>
            </div>

            <div className="flex gap-3 overflow-hidden py-1">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-100 shrink-0" />
                ))}
            </div>
        </div>
    );
}
