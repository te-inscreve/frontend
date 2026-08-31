"use client";

import { useController, useFormContext } from "react-hook-form";

import { Label, Switch } from "@te-inscreve/components";

import type { ModalidadeCamposValues } from "../modalidade-form-schema";
import { CampoNumero } from "~/shared/ui/form/campo-numero";

/**
 * A chave de grupo e os dois limites que só existem por causa dela. Ficam
 * juntos porque um não faz sentido sem o outro: desligada a chave, os campos
 * saem da tela e o envio manda `null` nos dois.
 */
export function IsGrupoField() {
    const { control } = useFormContext<ModalidadeCamposValues>();
    const { field } = useController({ name: "isGrupo", control });

    return (
        <div className="flex flex-col gap-4 border-t pt-4">
            <div>
                <div className="flex items-center gap-2">
                    <Switch
                        id="isGrupo"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isGrupo">Modalidade em grupo</Label>
                </div>
                <p className="text-muted-foreground mt-1.5 max-w-md text-xs">
                    Ative quando a inscrição for feita por um conjunto de
                    participantes, não por uma pessoa.
                </p>
            </div>

            {field.value && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <CampoNumero<ModalidadeCamposValues>
                        name="minInscritosPorGrupo"
                        label="Mínimo de inscritos por grupo"
                        min={1}
                        placeholder="Ex.: 2"
                    />
                    <CampoNumero<ModalidadeCamposValues>
                        name="maxInscritosPorGrupo"
                        label="Máximo de inscritos por grupo"
                        min={1}
                        placeholder="Ex.: 8"
                    />
                </div>
            )}
        </div>
    );
}
