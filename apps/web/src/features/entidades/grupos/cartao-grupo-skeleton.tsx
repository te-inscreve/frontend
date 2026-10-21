import { Skeleton } from "@te-inscreve/components/skeleton";

/**
 * A geometria de um {@link CartaoGrupo} enquanto a grade carrega: título,
 * duas linhas de descrição e a linha dos selos, nas mesmas medidas do cartão
 * de verdade, para a grade não pular quando os dados chegarem.
 */
export function CartaoGrupoSkeleton() {
    return (
        <li className="bg-card flex flex-col gap-3 rounded-xl border p-4">
            <Skeleton className="h-5 w-3/5" />
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-3 w-16" />
            </div>
        </li>
    );
}

/** Uma grade de cartões-esqueleto — a mesma grade da {@link GradeGrupos}. */
export function GradeGruposSkeleton({ quantidade }: { quantidade: number }) {
    return (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: quantidade }, (_, indice) => (
                <CartaoGrupoSkeleton key={indice} />
            ))}
        </ul>
    );
}
