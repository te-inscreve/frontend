"use client";

import { useController, useFormContext } from "react-hook-form";

import { Label, Switch } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";

export function UnicoField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field } = useController({ name: "unico", control });

    return (
        <div className="border-t pt-4">
            <div className="flex items-center gap-2">
                <Switch
                    id="unico"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
                <Label htmlFor="unico">Evento único</Label>
            </div>
            <p className="text-muted-foreground mt-1.5 max-w-md text-xs">
                Desative se este evento terá novas edições em anos seguintes.
            </p>
        </div>
    );
}
