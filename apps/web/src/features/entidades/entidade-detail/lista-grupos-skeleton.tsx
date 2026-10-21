import { Skeleton } from "@te-inscreve/components/skeleton";

/** Quantos cartões o preview do painel mostra — os mesmos que o esqueleto ocupa. */
export const GRUPOS_NO_PAINEL = 4;

/**
 * A geometria do preview de grupos enquanto a primeira página chega: o
 * mesmo contêiner conectado de {@link ListaGrupos}, com esqueletos no lugar
 * dos grupos de verdade, e o rodapé do "Ver mais" nas medidas certas — nada
 * salta quando a resposta chegar.
 */
export function ListaGruposSkeleton() {
    return (
        <div className="bg-border overflow-hidden rounded-xl border">
            <ul className="bg-border grid gap-px sm:grid-cols-2">
                {Array.from({ length: GRUPOS_NO_PAINEL }, (_, indice) => (
                    <li key={indice} className="bg-card flex flex-col gap-3 p-3">
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
                ))}
            </ul>

            <div className="bg-card flex items-center justify-between gap-2 px-3 py-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}
