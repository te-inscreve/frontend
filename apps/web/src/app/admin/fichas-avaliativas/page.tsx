import { Suspense } from "react";
import Link from "next/link";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { Button } from "@te-inscreve/components";

import { ListaModelosFicha } from "~/features/avaliacoes/lista-modelos-ficha/lista-modelos-ficha";
import { ListaModelosFichaSkeleton } from "~/features/avaliacoes/lista-modelos-ficha/lista-modelos-ficha-skeleton";
import { prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Fichas avaliativas | Te Inscreve",
    description: "Modelos de ficha avaliativa da entidade",
};

export default function FichasAvaliativasPage() {
    void prefetch(trpc.fichaAvaliativa.getAll.queryOptions({}));

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-primary flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
                        <ClipboardTextIcon size={32} weight="duotone" />
                        Fichas avaliativas
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Monte os modelos com que os avaliadores julgam as
                        categorias dos seus eventos.
                    </p>
                </div>

                <Button asChild className="w-full sm:w-auto">
                    <Link href="/admin/fichas-avaliativas/criar">
                        <PlusIcon />
                        Criar modelo
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<ListaModelosFichaSkeleton />}>
                <ListaModelosFicha />
            </Suspense>
        </div>
    );
}
