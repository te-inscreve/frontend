import { Skeleton } from "@te-inscreve/components/components/skeleton";

/** Ocupa o mesmo espaço do painel da aba enquanto a modalidade não chega. */
export function DetalheModalidadeSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando modalidade"
            className="flex flex-col gap-4"
        >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-5 w-28" />
                ))}
                <Skeleton className="ml-auto h-5 w-24" />
            </div>

            <div className="flex gap-3 overflow-hidden py-1">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-100 shrink-0" />
                ))}
            </div>
        </div>
    );
}
