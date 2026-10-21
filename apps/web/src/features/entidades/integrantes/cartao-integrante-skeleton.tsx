import { Skeleton } from "@te-inscreve/components/skeleton";

/**
 * A geometria de um cartão de integrante enquanto a lista carrega: avatar,
 * nome e a linha de resumo, nas mesmas medidas do cartão de verdade, para a
 * grade não pular quando os dados chegarem.
 */
export function CartaoIntegranteSkeleton() {
    return (
        <li className="bg-card flex items-center gap-3 rounded-xl border p-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </li>
    );
}

/** Uma grade de cartões-esqueleto — a mesma grade da lista de verdade. */
export function GradeIntegrantesSkeleton({
    quantidade,
}: {
    quantidade: number;
}) {
    return (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: quantidade }, (_, indice) => (
                <CartaoIntegranteSkeleton key={indice} />
            ))}
        </ul>
    );
}
