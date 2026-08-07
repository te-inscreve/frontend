"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/shared/api/trpc/client";

export function useListaEventos() {
    const params = useSearchParams();
    const trpc = useTRPC();
    const { data: eventos = [], ...resto } = useQuery(
        trpc.evento.getAll.queryOptions({
            search: params.get("search") ?? undefined,
        }),
    );
    return {
        eventos,
        ...resto,
    };
}
