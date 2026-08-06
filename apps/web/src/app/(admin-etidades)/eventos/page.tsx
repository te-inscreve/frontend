"use client";

import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/shared/api/trpc/react";

export default function EventosPage() {
    const trpc = useTRPC();
    const { data: eventos, isFetching } = useQuery(
        trpc.evento.all.queryOptions(),
    );
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                <ConfettiIcon className="mr-2 inline-flex" weight="duotone" />
                Eventos
            </h1>
            <p className="text-muted-foreground">
                Página de eventos do admin entidades.
            </p>
            {isFetching && (
                <p className="shimmer">
                    <SpinnerIcon className="mr-2 inline-flex animate-spin" />
                    Carregando eventos...
                </p>
            )}
            <ul className="flex flex-col gap-2">
                {eventos?.map((evento) => (
                    <li key={evento.id}>
                        <a
                            href={`/admin-entidades/eventos/${evento.id}`}
                            className="text-primary hover:underline"
                        >
                            {evento.nome}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
