"use client";

import { useMemo } from "react";
import Link from "next/dist/client/link";
import {
    BuildingsIcon,
    CalendarDotsIcon,
    MapPinIcon,
} from "@phosphor-icons/react";

import type { Evento } from "@te-inscreve/schemas";
import {
    Card,
    CardContent,
    CardFooter,
    CardTitle,
} from "@te-inscreve/components/card";

import { FallbackImage } from "~/shared/ui/fallback-image";
import { timeAgo, useDateRangeFormatter } from "~/shared/utils/format-date";

export function CardEvento({ evento }: { evento: Evento }) {
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
        <Link href={`/admin/eventos/${evento.slug}`}>
            <Card className="cursor-pointer gap-4 py-0 shadow-none">
                <FallbackImage
                    src={evento.cartaz}
                    alt={evento.nome}
                    width={450}
                    height={450}
                    className="h-64 w-full rounded-t-xl object-cover"
                />
                <CardContent className="flex flex-col gap-1 px-4!">
                    <CardTitle className="mb-2!">{evento.nome}</CardTitle>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CalendarDotsIcon />
                        {dataFormatada}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <MapPinIcon />
                        {evento.local}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <BuildingsIcon />
                        {evento.promotor.nome}
                    </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                    <p className="text-muted-foreground text-sm">Encerrado</p>
                    <p className="text-muted-foreground text-sm">
                        {timeAgoString}
                    </p>
                </CardFooter>
            </Card>
        </Link>
    );
}
