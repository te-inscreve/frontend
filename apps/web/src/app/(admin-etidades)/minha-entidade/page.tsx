"use client";

import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/shared/api/trpc/client";

export default function MinhaEntidadePage() {
    const trpc = useTRPC();
    useQuery({
        queryKey: ["entidade.getAll"],
        queryFn: () => {
            return trpc.entidade.getAll.queryFilter();
        },
    });
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                <ConfettiIcon className="mr-2 inline-flex" weight="duotone" />
                Minha Entidade
            </h1>
            <p className="text-muted-foreground">
                Página da minha entidade do admin entidades.
            </p>
        </div>
    );
}
