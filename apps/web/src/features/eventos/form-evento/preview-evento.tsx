"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { useWatch } from "react-hook-form";

import { Badge, CardHeader } from "@te-inscreve/components";
import { useFormContext } from "@te-inscreve/components/components/field";

import type { EventoFormValues, Periodo } from "./evento-form-schema";
import { useDateRangeFormatter } from "~/shared/utils/format-date";
import { useObjectUrl } from "~/shared/utils/use-object-url";

/**
 * Espelha o `CardEvento` da listagem pública para o organizador ver o cartaz do
 * jeito que ele vai aparecer. Não reusa aquele componente porque aqui os dados
 * ainda são rascunho: o evento não tem `slug` para linkar nem `promotor`, e o
 * cartaz é um blob local.
 */
export function PreviewEvento() {
    const { control } = useFormContext<EventoFormValues>();
    const valores = useWatch({ control }) as EventoFormValues;
    const cartazUrl = useObjectUrl(valores.cartaz);
    const { nome, local, periodoEvento, periodoInscricoes, publicado } =
        valores;
    const { formatDateRange } = useDateRangeFormatter();

    const formatar = ({ from, to }: Periodo, vazio: string) =>
        from && to ? formatDateRange(from, to) : vazio;

    return (
        <div className="flex flex-col gap-2">
            <CardHeader className="gap-1 px-0">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                    Pré-visualização do cartaz
                </p>
            </CardHeader>

            <div className="overflow-hidden rounded-lg border">
                {cartazUrl ? (
                    // Blob local, sem host remoto para o next/image otimizar.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={cartazUrl}
                        alt={`Cartaz de ${nome || "evento sem nome"}`}
                        className="h-48 w-full border-b object-cover"
                    />
                ) : (
                    <div className="bg-muted text-muted-foreground relative flex h-48 items-center justify-center border-b">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                            style={{
                                backgroundImage:
                                    "radial-gradient(rgb(0 0 0 / 0.1) 1px, transparent 1px)",
                                backgroundSize: "16px 16px",
                            }}
                        />
                        <p className="relative px-6 text-center text-sm">
                            Anexe um cartaz para ver a prévia
                        </p>
                    </div>
                )}

                <div className="bg-card flex flex-col gap-1.5 p-4">
                    <p className="text-lg leading-snug font-bold">
                        {nome || "Nome do evento"}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CalendarDotsIcon className="shrink-0" />
                        {formatar(periodoEvento, "Datas a definir")}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <MapPinIcon className="shrink-0" />
                        <span className="truncate">
                            {local || "Local a definir"}
                        </span>
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2.5">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <TicketIcon className="shrink-0" />
                            {formatar(
                                periodoInscricoes,
                                "Inscrições a definir",
                            )}
                        </span>
                        <Badge variant={publicado ? "default" : "secondary"}>
                            {publicado ? "Publicado" : "Rascunho"}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}
