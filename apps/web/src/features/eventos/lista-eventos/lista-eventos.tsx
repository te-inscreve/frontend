"use client";

import Link from "next/dist/client/link";
import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";

import { CardEvento } from "../shared/card-evento";
import { useListaEventos } from "./use-lista-eventos";

export function ListaEventos() {
    const { eventos, isLoading, isError, error } = useListaEventos();
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading && (
                <div className="text-muted-foreground col-span-full flex items-center gap-2 py-12 text-sm">
                    <SpinnerIcon className="mr-2 inline-flex animate-spin" />
                    Carregando eventos...
                </div>
            )}
            {isError && (
                <div className="text-destructive col-span-full flex items-center gap-2 py-12 text-sm">
                    <BugIcon className="mr-2 inline-flex" size={18} />
                    {error.message}
                </div>
            )}
            {!isLoading && !isError && eventos.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-xl border border-dashed py-12 text-center text-sm">
                    Nenhum evento encontrado.
                </div>
            )}
            {eventos.map((evento) => (
                <Link
                    key={evento.id}
                    className="block h-full"
                    href={`/admin/eventos/${evento.id}`}
                >
                    <CardEvento evento={evento} />
                </Link>
            ))}
        </div>
    );
}
