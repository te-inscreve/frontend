"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { Modalidade } from "@te-inscreve/schemas";

import type { ModalidadeRapidaFormValues } from "../form-modalidade/modalidade-form-schema";
import { revalidarEvento } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    modalidadeRapidaFormSchema,
    modalidadeRapidaInput,
} from "../form-modalidade/modalidade-form-schema";

interface Props {
    /** Evento dono da modalidade — vem da rota, não do formulário. */
    eventoId: number;
    onSuccess?: (modalidade: Modalidade) => void;
}

/**
 * Estado do cadastro rápido de modalidade: um campo só, o nome.
 *
 * É o atalho do {@link useFormModalidade}, para quem prefere cadastrar a fila
 * inteira de modalidades e só depois detalhar cada uma. As regras vão no
 * padrão e a modalidade nasce sem categoria — nada aqui é irreversível, tudo
 * é editável nas telas de sempre.
 */
export function useFormModalidadeRapida({ eventoId, onSuccess }: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");

    const form = useForm<ModalidadeRapidaFormValues>({
        resolver: zodResolver(modalidadeRapidaFormSchema),
        defaultValues: { nome: "" },
        mode: "onSubmit",
    });

    const criarModalidade = useMutation(
        trpc.modalidade.create.mutationOptions({
            onSuccess: async (modalidade) => {
                setSalvamento("success");

                // As abas são renderizadas no servidor, a partir do evento:
                // sem derrubar o cache dele, o `router.refresh()` de quem
                // chama não traria a modalidade nova.
                await revalidarEvento(eventoId);
                await queryClient.invalidateQueries(
                    trpc.evento.getById.queryFilter({ id: eventoId }),
                );

                form.reset();
                onSuccess?.(modalidade);
            },
            onError: (error) => {
                setSalvamento("idle");

                const doNome = error.data?.fieldErrors?.nome;
                if (doNome?.length) {
                    form.setError("nome", {
                        type: "server",
                        message: doNome.join(" "),
                    });
                }
            },
        }),
    );

    function salvar(valoresValidos: ModalidadeRapidaFormValues) {
        setSalvamento("loading");
        criarModalidade.mutate(modalidadeRapidaInput(valoresValidos, eventoId));
    }

    return {
        form,
        salvamento,
        salvar,
        /**
         * Erro de campo que este formulário não mostra — a descrição, por
         * exemplo, que o atalho manda vazia. Sem isto a recusa viraria só um
         * "não foi possível", sem dizer o que o backend recusou.
         */
        erroDeOutroCampo: mensagemForaDoNome(criarModalidade.error),
        erro: criarModalidade.error,
    };
}

function mensagemForaDoNome(
    error: {
        data?: { fieldErrors?: Record<string, string[]> | null } | null;
    } | null,
) {
    const campos = Object.entries(error?.data?.fieldErrors ?? {}).filter(
        ([campo]) => campo !== "nome",
    );

    const mensagens = campos.flatMap(([, mensagens]) => mensagens);
    return mensagens.length ? mensagens.join(" ") : null;
}
