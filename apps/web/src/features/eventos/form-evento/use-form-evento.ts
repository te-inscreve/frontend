"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Evento } from "@te-inscreve/schemas";

import type { EventoFormValues } from "./evento-form-schema";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    eventoFormData,
    eventoFormDefaults,
    eventoFormSchema,
} from "./evento-form-schema";

interface Props {
    onSucess?: (evento: Evento) => void;
}

export function useFormEvento({ onSucess }: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");
    const form = useForm<EventoFormValues>({
        resolver: zodResolver(eventoFormSchema),
        defaultValues: eventoFormDefaults,
        mode: "onTouched",
    });
    const criarEvento = useMutation(
        trpc.evento.create.mutationOptions({
            onSuccess: async (evento) => {
                setSalvamento("success");
                await queryClient.invalidateQueries(
                    trpc.evento.getAll.queryFilter(),
                );
                onSucess?.(evento);
            },
            onError: (error) => {
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
        }),
    );

    function salvar(valoresValidos: EventoFormValues) {
        setSalvamento("loading");
        criarEvento.mutate(eventoFormData(valoresValidos));
    }

    return {
        form,
        salvamento,
        salvar,
        erro: criarEvento.error,
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
