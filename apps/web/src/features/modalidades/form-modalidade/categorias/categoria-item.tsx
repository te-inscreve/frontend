"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

import { Button } from "@te-inscreve/components";

import type { ModalidadeFormValues } from "../modalidade-form-schema";
import { CampoNumero } from "~/shared/ui/form/campo-numero";
import { CampoTexto } from "~/shared/ui/form/campo-texto";

interface Props {
    indice: number;
    /**
     * Só é possível remover enquanto sobrar categoria — a modalidade precisa
     * de pelo menos uma.
     */
    podeRemover: boolean;
    onRemover: () => void;
}

/**
 * Uma categoria do formulário aninhado. Os campos usam o caminho
 * `categorias.<indice>.<campo>`, então o array vive num único `useForm`.
 */
export function CategoriaItem({ indice, podeRemover, onRemover }: Props) {
    return (
        <li className="bg-muted/30 flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">
                    Categoria {indice + 1}
                </h3>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onRemover}
                    disabled={!podeRemover}
                >
                    <TrashIcon aria-hidden="true" />
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-6">
                <CampoTexto<ModalidadeFormValues>
                    name={`categorias.${indice}.nome`}
                    label="Nome da categoria"
                    placeholder="Ex.: Juvenil feminino"
                    className="col-span-4"
                />
                <CampoNumero<ModalidadeFormValues>
                    name={`categorias.${indice}.maxInscricoes`}
                    label="Limite de inscrições"
                    opcional
                    min={1}
                    placeholder="Sem limite"
                    className="col-span-2"
                />

                <CampoNumero<ModalidadeFormValues>
                    name={`categorias.${indice}.idadeMinima`}
                    label="Idade mínima"
                    placeholder="Ex.: 12"
                    className="col-span-3"
                />
                <CampoNumero<ModalidadeFormValues>
                    name={`categorias.${indice}.idadeMaxima`}
                    label="Idade máxima"
                    placeholder="Ex.: 17"
                    className="col-span-3"
                />
            </div>
        </li>
    );
}
