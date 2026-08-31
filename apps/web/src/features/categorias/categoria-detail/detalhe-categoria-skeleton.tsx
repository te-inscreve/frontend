import { Skeleton } from "@te-inscreve/components/components/skeleton";

/** Ocupa o mesmo espaço do detalhe enquanto a categoria não chega. */
export function DetalheCategoriaSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando categoria"
            className="flex flex-col gap-4"
        >
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-64" />
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-5 w-44" />
                    ))}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="flex flex-col gap-4 lg:order-2 lg:col-span-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="flex flex-col gap-4 lg:order-1">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
    );
}
