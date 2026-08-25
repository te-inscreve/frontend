"use client";

import type { FieldPath } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { Modalidade } from "@te-inscreve/schemas";

import type { ModalidadeFormValues } from "./modalidade-form-schema";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    modalidadeFormDefaults,
    modalidadeFormInput,
    modalidadeFormSchema,
} from "./modalidade-form-schema";

interface Props {
    /** Evento dono da modalidade — vem da rota, não do formulário. */
    eventoId: number;
    onSuccess?: (modalidade: Modalidade) => void;
}

/**
 * Estado do formulário de modalidade e o envio para a API, separados da tela:
 * o componente só monta os campos e lê `salvamento`.
 */
export function useFormModalidade({ eventoId, onSuccess }: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");

    const form = useForm<ModalidadeFormValues>({
        resolver: zodResolver(modalidadeFormSchema),
        defaultValues: modalidadeFormDefaults,
        mode: "onTouched",
    });

    const criarModalidade = useMutation(
        trpc.modalidade.create.mutationOptions({
            onSuccess: async (modalidade) => {
                setSalvamento("success");
                await queryClient.invalidateQueries(
                    trpc.modalidade.getAll.queryFilter({ eventoId }),
                );
                onSuccess?.(modalidade);
            },
            onError: (error) => {
                setSalvamento("idle");

                for (const [campo, mensagens] of Object.entries(
                    error.data?.fieldErrors ?? {},
                )) {
                    const campoDoFormulario = campoModalidadeForm(campo);
                    if (!campoDoFormulario || !mensagens.length) continue;

                    form.setError(campoDoFormulario, {
                        type: "server",
                        message: mensagens.join(" "),
                    });
                }
            },
        }),
    );

    function salvar(valoresValidos: ModalidadeFormValues) {
        setSalvamento("loading");
        criarModalidade.mutate(modalidadeFormInput(valoresValidos, eventoId));
    }

    return {
        form,
        salvamento,
        salvar,
        erro: criarModalidade.error,
    };
}

/**
 * Nome do campo na resposta da API → campo do formulário. O backend responde
 * em camelCase, mas o snake_case aparece nos erros que vêm do serializer sem
 * passar pelo `djangorestframework-camel-case`.
 */
function campoModalidadeForm(
    campoApi: string,
): FieldPath<ModalidadeFormValues> | null {
    const campos: Record<string, FieldPath<ModalidadeFormValues>> = {
        nome: "nome",
        descricao: "descricao",
        planilhaAberta: "planilhaAberta",
        planilha_aberta: "planilhaAberta",
        maxPosicaoPremiada: "maxPosicaoPremiada",
        max_posicao_premiada: "maxPosicaoPremiada",
        isGrupo: "isGrupo",
        is_grupo: "isGrupo",
        minInscritosPorGrupo: "minInscritosPorGrupo",
        min_inscritos_por_grupo: "minInscritosPorGrupo",
        maxInscritosPorGrupo: "maxInscritosPorGrupo",
        max_inscritos_por_grupo: "maxInscritosPorGrupo",
        maxInscricoesEntidadePorCategoria: "maxInscricoesEntidadePorCategoria",
        max_inscricoes_entidade_por_categoria:
            "maxInscricoesEntidadePorCategoria",
        categorias: "categorias",
    };

    return campos[campoApi] ?? null;
}
