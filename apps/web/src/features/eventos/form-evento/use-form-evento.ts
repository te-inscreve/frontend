"use client";

import type { TRPCClientErrorLike } from "@trpc/client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { AppRouter } from "@te-inscreve/api";
import type { Evento } from "@te-inscreve/schemas";

import type { EventoFormValues } from "./evento-form-schema";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    eventoFormData,
    eventoFormDefaults,
    eventoFormSchema,
    eventoFormValues,
} from "./evento-form-schema";

interface Props {
    /** Evento em edição. Ausente quando o formulário está criando um novo. */
    evento?: Evento;
    onSucess?: (evento: Evento) => void;
}

export function useFormEvento({ evento, onSucess }: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");
    const form = useForm<EventoFormValues>({
        resolver: zodResolver(eventoFormSchema),
        defaultValues: evento ? eventoFormValues(evento) : eventoFormDefaults,
        mode: "onTouched",
    });

    // As duas rotas recebem o mesmo multipart e devolvem o mesmo evento, então
    // criar e editar dividem o tratamento de sucesso e de erro por inteiro.
    const opcoes = {
        onSuccess: async (salvo: Evento) => {
            setSalvamento("success");
            await queryClient.invalidateQueries(
                trpc.evento.getAll.queryFilter(),
            );

            if (evento) {
                await queryClient.invalidateQueries(
                    trpc.evento.getById.queryFilter({ id: evento.id }),
                );
            }

            onSucess?.(salvo);
        },
        onError: (error: TRPCClientErrorLike<AppRouter>) => {
            setSalvamento("idle");

            for (const [campo, mensagens] of Object.entries(
                error.data?.fieldErrors ?? {},
            )) {
                const campoDoFormulario = campoEventoForm(campo);
                if (!campoDoFormulario || !mensagens.length) continue;

                form.setError(campoDoFormulario, {
                    type: "server",
                    message: mensagens.join(" "),
                });
            }
        },
    };

    const criarEvento = useMutation(trpc.evento.create.mutationOptions(opcoes));
    const editarEvento = useMutation(
        trpc.evento.update.mutationOptions(opcoes),
    );
    const mutacao = evento ? editarEvento : criarEvento;

    function salvar(valoresValidos: EventoFormValues) {
        setSalvamento("loading");
        mutacao.mutate(eventoFormData(valoresValidos, evento?.id));
    }

    return {
        form,
        salvamento,
        salvar,
        erro: mutacao.error,
    };
}

function campoEventoForm(campoApi: string): keyof EventoFormValues | null {
    const campos: Record<string, keyof EventoFormValues> = {
        nome: "nome",
        descricao: "descricao",
        local: "local",
        unico: "unico",
        publicado: "publicado",
        dataInicio: "periodoEvento",
        dataFim: "periodoEvento",
        data_inicio: "periodoEvento",
        data_fim: "periodoEvento",
        dataInicioInscricoes: "periodoInscricoes",
        dataFimInscricoes: "periodoInscricoes",
        data_inicio_inscricoes: "periodoInscricoes",
        data_fim_inscricoes: "periodoInscricoes",
        logo: "logo",
        cartaz: "cartaz",
        regulamento: "regulamento",
    };

    return campos[campoApi] ?? null;
}
