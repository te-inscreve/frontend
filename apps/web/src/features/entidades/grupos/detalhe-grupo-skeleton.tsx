import { Skeleton } from "@te-inscreve/components/skeleton";

import { CartaoIntegranteSkeleton } from "~/features/entidades/integrantes/cartao-integrante-skeleton";
import { LadoDaBancada } from "./bancada";

/**
 * O {@link DetalheGrupo} enquanto o detalhe do grupo não chega.
 *
 * Sem nome real para mostrar: a página do grupo (`grupos/[id]`) não sabe o
 * nome até `grupo.getById` responder — ao contrário da antiga bancada
 * embutida na grade, que já tinha o nome de quem abriu o cartão. Por isso o
 * título também é esqueleto, e não só o corpo.
 */
export function DetalheGrupoSkeleton({ className }: { className?: string }) {
    return (
        <LadoDaBancada
            titulo={<Skeleton className="h-5 w-40" />}
            descricao={<Skeleton className="h-3 w-48" />}
            className={className}
        >
            <div className="flex shrink-0 items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="ml-auto h-3 w-24" />
            </div>

            <h3 className="shrink-0 border-t pt-3 text-sm font-semibold">
                Formação
            </h3>

            <ul className="grid gap-3 2xl:grid-cols-2">
                <CartaoIntegranteSkeleton />
                <CartaoIntegranteSkeleton />
                <CartaoIntegranteSkeleton />
            </ul>
        </LadoDaBancada>
    );
}
