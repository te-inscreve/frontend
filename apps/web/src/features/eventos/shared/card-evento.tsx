"use client";

import { useMemo } from "react";
import { CalendarDotsIcon, MapPinIcon } from "@phosphor-icons/react";

import type { EventoPreview } from "@te-inscreve/schemas";
import {
    Card,
    CardContent,
    CardFooter,
    CardTitle,
} from "@te-inscreve/components/card";

import { FallbackImage } from "~/shared/ui/fallback-image";
import { timeAgo, useDateRangeFormatter } from "~/shared/utils/format-date";

export function CardEvento({ evento }: { evento: EventoPreview }) {
    const { formatDateRange } = useDateRangeFormatter();

    const timeAgoString = useMemo(() => {
        const dataFim = new Date(evento.dataFim);
        return timeAgo(dataFim);
    }, [evento.dataFim]);

    const dataFormatada = useMemo(() => {
        const dataInicio = new Date(evento.dataInicio);
        const dataFim = new Date(evento.dataFim);

        return formatDateRange(dataInicio, dataFim);
    }, [evento.dataInicio, evento.dataFim, formatDateRange]);

    return (
        <Card className="h-full gap-0 overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md">
            <FallbackImage
                src={evento.cartaz}
                alt={evento.nome}
                width={450}
                height={450}
                className="aspect-4/3 w-full rounded-none object-cover"
            />
            <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <CardTitle className="line-clamp-2 text-lg leading-tight">
                    {evento.nome}
                </CardTitle>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <CalendarDotsIcon />
                    {dataFormatada}
                </p>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <MapPinIcon />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {evento.local}
                    </span>
                </p>
                {/* <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <BuildingsIcon />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {evento.promotor.nome}
                    </span>
                </p> */}
            </CardContent>
            <CardFooter className="flex items-center justify-between px-4 pt-0 pb-4">
                <p className="text-muted-foreground text-sm">Encerrado</p>
                <p className="text-muted-foreground text-sm">{timeAgoString}</p>
            </CardFooter>
        </Card>
    );
}
