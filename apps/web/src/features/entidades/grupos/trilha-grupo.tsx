import Link from "next/link";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";

/**
 * Trilha "Grupos › nome do grupo" da página do grupo.
 *
 * Mesma forma de `TrilhaEvento` (`shared/ui/trilha-evento.tsx`): Server
 * Component com o próprio `<Suspense>`, para a navegação aparecer assim que o
 * grupo chega, sem esperar a bancada inteira. O `fetchQuery` reaproveita o
 * `prefetch` que `grupos/[id]/page.tsx` já dispara — o query client é
 * `cache`ado por request, então o grupo não é buscado duas vezes.
 *
 * Um `id` que não é mais de um grupo da entidade (404) some da trilha em vez
 * de derrubá-la: quem decide o 404 é `DetalheGrupoPagina`, não a navegação.
 */
export async function TrilhaGrupo({ id }: { id: number }) {
    const grupo = await getQueryClient().fetchQuery(
        trpc.grupo.getById.queryOptions({ id }),
    );

    if (!grupo) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/admin/minha-entidade/grupos">Grupos</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <BreadcrumbItem>
                    <BreadcrumbPage>{grupo.nome}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}

/** Espaço reservado da trilha enquanto o grupo não chega. */
export function TrilhaGrupoSkeleton() {
    return <Skeleton className="h-5 w-48" />;
}
