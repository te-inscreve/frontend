import { Card, CardContent, CardFooter } from "@te-inscreve/components/card";
import { Skeleton } from "@te-inscreve/components/skeleton";

/**
 * O lugar de um cartão de evento enquanto a lista não chegou.
 *
 * Repete a geometria do {@link CardEvento} peça por peça — cartaz em 4/3,
 * título de duas linhas, duas linhas de metadados e o rodapé —, porque um
 * esqueleto menor que o conteúdo faz a página pular quando os dados chegam, e
 * a espera visível vira duas. Ver `docs/fcp.md`.
 */
export function CardEventoSkeleton() {
    return (
        <Card className="h-full gap-0 overflow-hidden py-0 shadow-sm">
            <Skeleton className="aspect-4/3 w-full rounded-none" />

            <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>

            <CardFooter className="flex items-center justify-between px-4 pt-0 pb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </CardFooter>
        </Card>
    );
}
