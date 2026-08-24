import { Skeleton } from "@te-inscreve/components/components/skeleton";

/** Ocupa o mesmo espaço dos cartões enquanto as categorias da aba não chegam. */
export function ListCategoriasSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando categorias"
            className="flex gap-3 overflow-hidden py-1"
        >
            {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-100 shrink-0" />
            ))}
        </div>
    );
}
