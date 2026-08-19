"use client";

import { useController, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";

import type { EventoFormValues } from "../evento-form-schema";
import { useObjectUrl } from "~/shared/utils/use-object-url";
import { CampoImagem } from "../campo-imagem";

export function LogoField() {
    const { control } = useFormContext<EventoFormValues>();
    const { field, fieldState } = useController({ name: "logo", control });
    const previewUrl = useObjectUrl(field.value);

    return (
        <Field className="w-auto" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="logo">Logo</FieldLabel>
            <CampoImagem
                id="logo"
                label="Logo do evento"
                className="size-24"
                formato="circulo"
                ajuste="contain"
                placeholder="Logo"
                previewUrl={previewUrl}
                onChange={field.onChange}
                invalido={fieldState.invalid}
            />
            <p className="text-muted-foreground max-w-30 text-xs">
                PNG quadrado, fundo transparente
            </p>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
