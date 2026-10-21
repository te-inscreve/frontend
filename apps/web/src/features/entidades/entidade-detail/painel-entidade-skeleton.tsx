import { Skeleton } from "@te-inscreve/components/components/skeleton";

/**
 * Espera do portão de `/admin/minha-entidade`, enquanto o perfil não chega.
 *
 * De propósito genérico: o portão cobre o painel, integrantes e grupos, que
 * têm conteúdos diferentes. O que as três telas dividem é a moldura — a mesma
 * largura máxima, o mesmo respiro — e é só isso que este esqueleto promete.
 * Desenhar aqui a cara de uma delas faria as outras duas darem um salto ao
 * trocar o esqueleto pelo conteúdo.
 */
export function PainelEntidadeSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando o painel da entidade"
            className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8"
        >
            <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="size-16 shrink-0 rounded-xl" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-9 w-72" />
                    <Skeleton className="h-5 w-40 rounded-full" />
                </div>
            </div>

            {[0, 1].map((secao) => (
                <div key={secao} className="flex flex-col gap-3">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="flex flex-col gap-2">
                        {[0, 1, 2].map((linha) => (
                            <Skeleton
                                key={linha}
                                className="h-14 w-full rounded-lg"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
