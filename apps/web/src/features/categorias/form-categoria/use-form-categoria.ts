"use client";

import type { FieldPath } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { Categoria } from "@te-inscreve/schemas";

import type { CategoriaFormValues } from "./categoria-form-schema";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    categoriaFormDefaults,
    categoriaFormInput,
    categoriaFormSchema,
} from "./categoria-form-schema";

interface Props {
    /** Evento e modalidade donos da categoria — vêm da rota, não do formulário. */
    eventoId: number;
    modalidadeId: number;
    onSuccess?: (categoria: Categoria) => void;
}

/**
 * Estado do formulário de categoria e o envio para a API, separados da tela.
 * É o irmão de `useFormModalidade` para a categoria criada sozinha, depois que
 * a modalidade já existe.
 */
export function useFormCategoria({ eventoId, modalidadeId, onSuccess }: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");

    const form = useForm<CategoriaFormValues>({
        resolver: zodResolver(categoriaFormSchema),
        defaultValues: categoriaFormDefaults,
        mode: "onTouched",
    });

    const criarCategoria = useMutation(
        trpc.categoria.create.mutationOptions({
            onSuccess: async (categoria) => {
                setSalvamento("success");
                await queryClient.invalidateQueries(
                    trpc.categoria.getAll.queryFilter({
                        eventoId,
                        modalidadeId,
                    }),
                );
                onSuccess?.(categoria);
            },
            onError: (error) => {
                setSalvamento("idle");

                for (const [campo, mensagens] of Object.entries(
                    error.data?.fieldErrors ?? {},
                )) {
                    const campoDoFormulario = campoCategoriaForm(campo);
                    if (!campoDoFormulario || !mensagens.length) continue;

                    form.setError(campoDoFormulario, {
                        type: "server",
                        message: mensagens.join(" "),
                    });
                }
            },
        }),
    );

    function salvar(valoresValidos: CategoriaFormValues) {
        setSalvamento("loading");
        criarCategoria.mutate({
            eventoId,
            modalidadeId,
            categoria: categoriaFormInput(valoresValidos),
        });
    }

    return {
        form,
        salvamento,
        salvar,
        erro: criarCategoria.error,
    };
}

/**
 * Nome do campo na resposta da API → campo do formulário. O backend responde
 * em camelCase, mas o snake_case aparece nos erros que vêm do serializer sem
 * passar pelo `djangorestframework-camel-case`.
 */
function campoCategoriaForm(
    campoApi: string,
): FieldPath<CategoriaFormValues> | null {
    const campos: Record<string, FieldPath<CategoriaFormValues>> = {
        nome: "nome",
        idadeMinima: "idadeMinima",
        idade_minima: "idadeMinima",
        idadeMaxima: "idadeMaxima",
        idade_maxima: "idadeMaxima",
        maxInscricoes: "maxInscricoes",
        max_inscricoes: "maxInscricoes",
    };

    return campos[campoApi] ?? null;
}
