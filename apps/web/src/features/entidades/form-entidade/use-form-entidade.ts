"use client";

import type { FieldPath } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { MinhaEntidade } from "@te-inscreve/schemas";

import type { EntidadeFormValues } from "./entidade-form-schema";
import { revalidarEntidades } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    entidadeFormDefaults,
    entidadeFormInput,
    entidadeFormSchema,
} from "./entidade-form-schema";

interface Props {
    /** A entidade em edição — o formulário nasce preenchido com ela. */
    entidade: MinhaEntidade;
    onSuccess?: (entidade: MinhaEntidade) => void;
}

/**
 * Estado do formulário da entidade e o envio para a API, separados da tela —
 * o irmão de `useFormCategoria` para o cadastro da própria entidade.
 *
 * `entidade.minha` é lida sem `next.revalidate`, então a tela que acabou de
 * salvar não tem cache de servidor para derrubar. Quem envelhece é a listagem
 * de `entidade.getAll` — o nome editado aparece lá —, e por isso o
 * `revalidarEntidades` antes do `onSuccess`: ele precisa terminar antes do
 * `router.refresh()` de quem chama.
 */
export function useFormEntidade({ entidade, onSuccess }: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");

    const form = useForm<EntidadeFormValues>({
        resolver: zodResolver(entidadeFormSchema),
        defaultValues: entidadeFormDefaults(entidade),
        mode: "onTouched",
    });

    const salvarEntidade = useMutation(
        trpc.entidade.atualizarMinha.mutationOptions({
            onSuccess: async (salva) => {
                setSalvamento("success");

                await revalidarEntidades();
                await queryClient.invalidateQueries(
                    trpc.entidade.minha.queryFilter(),
                );

                onSuccess?.(salva);
            },
            onError: (error) => {
                setSalvamento("idle");

                for (const [campo, mensagens] of Object.entries(
                    error.data?.fieldErrors ?? {},
                )) {
                    const campoDoFormulario = campoEntidadeForm(campo);
                    if (!campoDoFormulario || !mensagens.length) continue;

                    form.setError(campoDoFormulario, {
                        type: "server",
                        message: mensagens.join(" "),
                    });
                }
            },
        }),
    );

    function salvar(valoresValidos: EntidadeFormValues) {
        setSalvamento("loading");
        salvarEntidade.mutate(entidadeFormInput(valoresValidos));
    }

    return { form, salvamento, salvar, erro: salvarEntidade.error };
}

/**
 * Nome do campo na resposta da API → campo do formulário. O backend responde
 * em camelCase, mas o snake_case aparece nos erros que vêm do serializer sem
 * passar pelo `djangorestframework-camel-case`.
 */
function campoEntidadeForm(
    campoApi: string,
): FieldPath<EntidadeFormValues> | null {
    const campos: Record<string, FieldPath<EntidadeFormValues>> = {
        nome: "nome",
        cnpj: "cnpj",
        telefone: "telefone",
        cidade: "cidade",
        estado: "estado",
    };

    return campos[campoApi] ?? null;
}
