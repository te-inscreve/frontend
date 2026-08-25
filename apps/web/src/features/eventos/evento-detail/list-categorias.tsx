import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import type { Modalidade } from "@te-inscreve/schemas";
import { Button } from "@te-inscreve/components";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { HorizontalScrollList } from "~/shared/ui/horizontal-scroll-list";
import { CardCategoria } from "./card-categoria";

interface Props {
    eventoId: number;
    modalidade: Modalidade;
}

/**
 * Categorias da modalidade aberta. Busca aqui dentro, atrás do `<Suspense>` do
 * `DetalheEvento`, para o cabeçalho e as abas irem para o stream sem esperar.
 */
export async function ListCategorias({ eventoId, modalidade }: Props) {
    const categorias = await getQueryClient().fetchQuery(
        trpc.categoria.getAll.queryOptions({
            eventoId,
            modalidadeId: modalidade.id,
        }),
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                    <Link
                        href={`/admin/eventos/${eventoId}/modalidade/${modalidade.id}/criar-categoria`}
                    >
                        <PlusIcon aria-hidden="true" />
                        Criar categoria
                    </Link>
                </Button>
            </div>

            <HorizontalScrollList
                label={`Categorias de ${modalidade.nome}`}
                emptyState={
                    <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
                        Esta modalidade ainda não tem categorias. Crie a
                        primeira para abrir inscrições.
                    </p>
                }
            >
                {categorias.map((categoria) => (
                    <CardCategoria key={categoria.id} categoria={categoria} />
                ))}
            </HorizontalScrollList>
        </div>
    );
}
