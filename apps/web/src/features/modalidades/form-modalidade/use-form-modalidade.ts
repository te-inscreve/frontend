"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { Modalidade } from "@te-inscreve/schemas";

import type {
    ModalidadeCamposValues,
    ModalidadeFormValues,
} from "./modalidade-form-schema";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    modalidadeEdicaoFormSchema,
    modalidadeEdicaoInput,
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
                // As abas saem de `evento.getById`, que agora traz as
                // modalidades — invalidar a lista solta não mudaria a página.
                await queryClient.invalidateQueries(
                    trpc.evento.getById.queryFilter({ id: eventoId }),
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

interface PropsEdicao {
    /** Evento e modalidade em edição — ambos vêm da rota. */
    eventoId: number;
    modalidade: Modalidade;
    onSuccess?: (modalidade: Modalidade) => void;
}

/**
 * O irmão de {@link useFormModalidade} para a modalidade que já existe.
 *
 * As categorias ficam de fora: elas têm CRUD próprio, e o `PATCH` que este
 * hook envia carrega só as regras da modalidade.
 */
export function useFormEdicaoModalidade({
    eventoId,
    modalidade,
    onSuccess,
}: PropsEdicao) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");

    const form = useForm<ModalidadeCamposValues>({
        resolver: zodResolver(modalidadeEdicaoFormSchema),
        // Os campos já nascem com o que a API devolveu.
        defaultValues: {
            nome: modalidade.nome,
            descricao: modalidade.descricao,
            planilhaAberta: modalidade.planilhaAberta,
            maxPosicaoPremiada: modalidade.maxPosicaoPremiada,
            isGrupo: modalidade.isGrupo,
            minInscritosPorGrupo: modalidade.minInscritosPorGrupo,
            maxInscritosPorGrupo: modalidade.maxInscritosPorGrupo,
            maxInscricoesEntidadePorCategoria:
                modalidade.maxInscricoesEntidadePorCategoria,
        },
        mode: "onTouched",
    });

    const editarModalidade = useMutation(
        trpc.modalidade.update.mutationOptions({
            onSuccess: async (salva) => {
                setSalvamento("success");

                // O painel da aba sai de `modalidade.getById`, e o rótulo dela
                // vem das modalidades do evento — o nome pode ter mudado.
                await Promise.all([
                    queryClient.invalidateQueries(
                        trpc.modalidade.getById.queryFilter({
                            eventoId,
                            modalidadeId: modalidade.id,
                        }),
                    ),
                    queryClient.invalidateQueries(
                        trpc.evento.getById.queryFilter({ id: eventoId }),
                    ),
                ]);

                onSuccess?.(salva);
            },
            onError: (error) => {
                setSalvamento("idle");

                for (const [campo, mensagens] of Object.entries(
                    error.data?.fieldErrors ?? {},
                )) {
                    const campoDoFormulario = campoModalidadeForm(campo);
                    if (
                        !campoDoFormulario ||
                        campoDoFormulario === "categorias" ||
                        !mensagens.length
                    ) {
                        continue;
                    }

                    form.setError(campoDoFormulario, {
                        type: "server",
                        message: mensagens.join(" "),
                    });
                }
            },
        }),
    );

    function salvar(valoresValidos: ModalidadeCamposValues) {
        setSalvamento("loading");
        editarModalidade.mutate({
            eventoId,
            modalidadeId: modalidade.id,
            modalidade: modalidadeEdicaoInput(valoresValidos),
        });
    }

    return {
        form,
        salvamento,
        salvar,
        erro: editarModalidade.error,
    };
}

/**
 * Os campos que a API sabe apontar num erro: os da modalidade e a lista de
 * categorias, que só existe no formulário de criação.
 */
type CampoDaModalidade = keyof ModalidadeCamposValues | "categorias";

/**
 * Nome do campo na resposta da API → campo do formulário. O backend responde
 * em camelCase, mas o snake_case aparece nos erros que vêm do serializer sem
 * passar pelo `djangorestframework-camel-case`.
 */
function campoModalidadeForm(campoApi: string): CampoDaModalidade | null {
    const campos: Record<string, CampoDaModalidade> = {
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
