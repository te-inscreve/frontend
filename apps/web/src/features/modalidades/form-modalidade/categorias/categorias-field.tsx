"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button, FieldError } from "@te-inscreve/components";

import type { ModalidadeFormValues } from "../modalidade-form-schema";
import { categoriaFormDefaults } from "~/features/categorias/form-categoria/categoria-form-schema";
import { CategoriaItem } from "./categoria-item";

/**
 * Formulário aninhado das categorias. Elas são criadas junto da modalidade —
 * uma modalidade sem categoria não aceitaria inscrição nenhuma.
 */
export function CategoriasField() {
    const { control, formState } = useFormContext<ModalidadeFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "categorias",
    });

    // O erro do array (a lista vazia) não é de nenhuma categoria, então mora
    // na raiz — os erros de campo aparecem dentro de cada item.
    const erroDaLista =
        formState.errors.categorias?.root ?? formState.errors.categorias;

    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-4">
                {fields.map((campo, indice) => (
                    <CategoriaItem
                        key={campo.id}
                        indice={indice}
                        podeRemover={fields.length > 1}
                        onRemover={() => remove(indice)}
                    />
                ))}
            </ul>

            {erroDaLista?.message && (
                <FieldError errors={[{ message: erroDaLista.message }]} />
            )}

            <Button
                type="button"
                variant="outline"
                onClick={() => append(categoriaFormDefaults)}
                className="self-start"
            >
                <PlusIcon aria-hidden="true" />
                Adicionar categoria
            </Button>
        </div>
    );
}
