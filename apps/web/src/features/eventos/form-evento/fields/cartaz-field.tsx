"use client";

import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { useObjectUrl } from "~/shared/utils/use-object-url";
import { CampoImagem } from "../campo-imagem";

export function CartazField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({ name: "cartaz", control });
    const previewUrl = useObjectUrl(field.value);

    return (
        <Field className="w-auto" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="cartaz">Capa do evento</FieldLabel>
            <CampoImagem
                id="cartaz"
                label="Cartaz do evento"
                className="h-24 w-35"
                formato="retangulo"
                ajuste="cover"
                placeholder="Cartaz"
                previewUrl={previewUrl}
                onChange={field.onChange}
                invalido={fieldState.invalid}
            />
            <p className="text-muted-foreground max-w-35 text-xs">
                Usado na pré-visualização ao lado
            </p>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
