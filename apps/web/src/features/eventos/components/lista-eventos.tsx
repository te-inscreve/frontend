"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";

import { useListaEventos } from "../lib/use-lista-eventos";
import { CardEvento } from "./card-evento";

export function ListaEventos() {
    const { eventos, isLoading, isError, error } = useListaEventos();
    return (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {isLoading && (
                <p className="shimmer">
                    <SpinnerIcon className="mr-2 inline-flex animate-spin" />
                    Carregando eventos...
                </p>
            )}
            {isError && (
                <p className="text-destructive">
                    <BugIcon className="mr-2 inline-flex" size={18} />
                    {error.message}
                </p>
            )}
            {eventos.map((evento) => (
                <CardEvento key={evento.id} evento={evento} />
            ))}
        </ul>
    );
}
