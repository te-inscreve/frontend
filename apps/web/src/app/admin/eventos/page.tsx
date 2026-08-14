import { use } from "react";
import Link from "next/link";
import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { Button, Input } from "@te-inscreve/components";

import { ListaEventos } from "~/features/eventos/lista-eventos/lista-eventos";
import { HydrateClient, prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Meus Eventos | Te Inscreve",
    description: "Lista de eventos do usuário",
};

export default function EventosPage({
    params,
}: {
    params: Promise<{ search?: string }>;
}) {
    const { search } = use(params);
    void prefetch(trpc.evento.getAll.queryOptions({ search }));

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
                        <ConfettiIcon size={32} weight="duotone" />
                        Meus Eventos
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Gerencie e acompanhe os eventos da sua entidade.
                    </p>
                </div>

                <Button asChild className="w-full sm:w-auto">
                    <Link href="/admin/eventos/criar">
                        <PlusIcon />
                        Novo evento
                    </Link>
                </Button>
            </div>

            <div className="relative w-full sm:max-w-sm">
                <MagnifyingGlassIcon
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                    aria-label="Buscar eventos"
                    className="bg-card h-10 pl-9"
                    placeholder="Buscar eventos"
                    type="search"
                />
            </div>

            <HydrateClient>
                <ListaEventos />
            </HydrateClient>
        </div>
    );
}
