"use client";

import { useController, useFormContext } from "react-hook-form";

import {
    Field,
    FieldError,
    FieldLabel,
    Textarea,
} from "@te-inscreve/components";

import type { ModalidadeCamposValues } from "../modalidade-form-schema";

export function DescricaoField() {
    const { control } = useFormContext<ModalidadeCamposValues>();
    const { field, fieldState } = useController({
        name: "descricao",
        control,
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="descricao" className="flex">
                Descrição
                <span className="text-muted-foreground ml-2 text-xs font-normal">
                    (opcional)
                </span>
            </FieldLabel>
            <Textarea
                {...field}
                id="descricao"
                rows={4}
                className="bg-card dark:bg-card min-h-22"
                placeholder="Explique como a modalidade funciona e o que ela avalia."
                aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
}
