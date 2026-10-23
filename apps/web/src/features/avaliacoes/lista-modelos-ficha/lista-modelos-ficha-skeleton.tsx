import { Skeleton } from "@te-inscreve/components/skeleton";

import { GRADE_MODELOS_FICHA } from "./lista-modelos-ficha";

/** Uma linha cheia no maior breakpoint. */
const ESQUELETOS = 5;

/**
 * O lugar da grade enquanto os modelos não chegaram: a prancheta em 3/4 do
 * {@link CartaoModeloFicha}, para a página não pular.
 */
export function ListaModelosFichaSkeleton() {
    return (
        <ul aria-hidden="true" className={GRADE_MODELOS_FICHA}>
            {Array.from({ length: ESQUELETOS }, (_, indice) => (
                <li key={indice} className="pt-2.5">
                    <Skeleton className="aspect-3/4 w-full rounded-lg" />
                </li>
            ))}
        </ul>
    );
}
