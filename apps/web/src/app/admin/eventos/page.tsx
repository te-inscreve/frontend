import { use } from "react";
import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";

import { ListaEventos } from "~/features/eventos/components/lista-eventos";
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
        <div className="flex min-h-screen flex-col gap-4 px-0 md:px-4 md:py-4">
            <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                <ConfettiIcon className="mr-2 inline-flex" weight="duotone" />
                Meus Eventos
            </h1>

            <HydrateClient>
                <ListaEventos />
            </HydrateClient>
        </div>
    );
}
