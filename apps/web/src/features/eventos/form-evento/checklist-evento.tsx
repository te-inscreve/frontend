"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleDashedIcon } from "@phosphor-icons/react/dist/ssr/CircleDashed";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@te-inscreve/components";

import type { EventoFormValues } from "./evento-form-schema";

/**
 * Recalculado a cada tecla a partir do estado do formulário — sem chamar a
 * validação, para o organizador ver o que falta antes de tentar salvar.
 */
function pendencias(valores: EventoFormValues) {
    return [
        { label: "Nome do evento", pronto: valores.nome.trim().length > 0 },
        { label: "Descrição", pronto: valores.descricao.trim().length > 0 },
        { label: "Local", pronto: valores.local.trim().length > 0 },
        {
            label: "Datas do evento",
            pronto: Boolean(
                valores.periodoEvento.from && valores.periodoEvento.to,
            ),
        },
        {
            label: "Datas de inscrição",
            pronto: Boolean(
                valores.periodoInscricoes.from && valores.periodoInscricoes.to,
            ),
        },
    ];
}

export function ChecklistEvento({ valores }: { valores: EventoFormValues }) {
    const itens = pendencias(valores);
    const concluidos = itens.filter((item) => item.pronto).length;

    return (
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <CardTitle className="text-base">O que falta</CardTitle>
            </CardHeader>

            <CardContent className="px-4">
                <ul className="flex flex-col gap-2.5">
                    {itens.map((item) => (
                        <li
                            key={item.label}
                            className="flex items-center gap-2 text-sm"
                        >
                            {item.pronto ? (
                                <CheckCircleIcon
                                    className="text-primary shrink-0"
                                    size={18}
                                    weight="duotone"
                                />
                            ) : (
                                <CircleDashedIcon
                                    className="text-muted-foreground shrink-0"
                                    size={18}
                                />
                            )}
                            {item.label}
                        </li>
                    ))}
                </ul>

                <p className="text-muted-foreground mt-3 text-xs">
                    {concluidos} de {itens.length} itens preenchidos
                </p>
            </CardContent>
        </Card>
    );
}
