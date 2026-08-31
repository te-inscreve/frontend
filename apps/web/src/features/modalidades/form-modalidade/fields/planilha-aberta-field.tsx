"use client";

import { useController, useFormContext } from "react-hook-form";

import { Label, Switch } from "@te-inscreve/components";

import type { ModalidadeCamposValues } from "../modalidade-form-schema";

export function PlanilhaAbertaField() {
    const { control } = useFormContext<ModalidadeCamposValues>();
    const { field } = useController({ name: "planilhaAberta", control });

    return (
        <div className="border-t pt-4">
            <div className="flex items-center gap-2">
                <Switch
                    id="planilhaAberta"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
                <Label htmlFor="planilhaAberta">Planilha aberta</Label>
            </div>
            <p className="text-muted-foreground mt-1.5 max-w-md text-xs">
                Deixe ativo para que as notas fiquem visíveis aos participantes
                durante a apuração.
            </p>
        </div>
    );
}
