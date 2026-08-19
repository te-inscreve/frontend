"use client";

import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel, Input } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";

export function LocalField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({ name: "local", control });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="local">Local</FieldLabel>
            <div className="relative">
                <MapPinIcon
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                    {...field}
                    id="local"
                    className="h-10 pl-9"
                    placeholder="Ex.: Ginásio Municipal de Vacaria"
                    aria-invalid={fieldState.invalid}
                />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
