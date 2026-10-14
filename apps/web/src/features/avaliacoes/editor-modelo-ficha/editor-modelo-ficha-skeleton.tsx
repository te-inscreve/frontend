import { Skeleton } from "@te-inscreve/components/components/skeleton";

/**
 * O editor enquanto o portão lê o perfil: cabeçalho, catálogo, a folha da
 * ficha e o rodapé nos mesmos lugares, para a tela não pular quando chega.
 */
export function EditorModeloFichaSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando o editor de modelo de ficha"
            className="flex h-full min-h-0 flex-col"
        >
            <div className="bg-card flex shrink-0 items-center gap-3 border-b px-4 py-3">
                <Skeleton className="size-8" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="ml-auto h-9 w-56" />
            </div>

            <div className="flex min-h-0 flex-1">
                <div className="bg-card hidden w-72 shrink-0 flex-col gap-3 border-r p-4 lg:flex">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 8 }, (_, indice) => (
                            <Skeleton key={indice} className="h-32" />
                        ))}
                    </div>
                </div>

                <div className="bg-muted/40 min-w-0 flex-1 overflow-hidden">
                    <div className="mx-auto w-full max-w-3xl px-4 py-8">
                        <div className="bg-card flex flex-col gap-6 rounded-lg border p-6 shadow-xs md:p-10">
                            <Skeleton className="h-9 w-2/3" />
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-28 w-full" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card flex shrink-0 justify-end gap-2 border-t px-4 py-3">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
            </div>
        </div>
    );
}
