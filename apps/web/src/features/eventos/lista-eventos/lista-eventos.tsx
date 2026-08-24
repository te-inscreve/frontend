"use client";

import Link from "next/dist/client/link";
import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";

import { CardEvento } from "../shared/card-evento";
import { useListaEventos } from "./use-lista-eventos";

export function ListaEventos() {
    const { eventos, isLoading, isError, error } = useListaEventos();
    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading && (
                <li className="text-muted-foreground col-span-full flex items-center gap-2 py-12 text-sm">
                    <SpinnerIcon className="mr-2 inline-flex animate-spin" />
                    Carregando eventos...
                </li>
            )}
            {isError && (
                <li className="text-destructive col-span-full flex items-center gap-2 py-12 text-sm">
                    <BugIcon className="mr-2 inline-flex" size={18} />
                    {error.message}
                </li>
            )}
            {!isLoading && !isError && eventos.length === 0 && (
                <li className="text-muted-foreground col-span-full rounded-xl border border-dashed py-12 text-center text-sm">
                    Nenhum evento encontrado.
                </li>
            )}
            {eventos.map((evento) => (
                <li key={evento.id}>
                    <Link
                        className="block h-full"
                        href={`/admin/eventos/${evento.id}`}
                    >
                        <CardEvento evento={evento} />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
