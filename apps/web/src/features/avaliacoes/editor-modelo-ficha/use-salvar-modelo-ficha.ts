"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { ModeloFichaDetalhe } from "@te-inscreve/schemas";

import type { ModeloFichaFormValues } from "./lib/modelo-ficha-form-schema";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    modeloFichaFormDefaults,
    modeloFichaFormSchema,
    paraCriarModeloFicha,
} from "./lib/modelo-ficha-form-schema";

/**
 * O formulário do modelo e o `POST` que o cria.
 *
 * O backend devolve as recusas de composição — campo que não pertence à
 * ficha, composição protegida — numa lista sem chave. Elas não têm campo onde
 * pousar, então vão para `errosGerais`, ao lado do botão de enviar.
 */
export function useSalvarModeloFicha({
    aoSalvar,
}: {
    aoSalvar: (modelo: ModeloFichaDetalhe) => void;
}) {
    const trpc = useTRPC();
    const [errosGerais, setErrosGerais] = useState<string[]>([]);

    const form = useForm<ModeloFichaFormValues>({
        resolver: zodResolver(modeloFichaFormSchema),
        defaultValues: modeloFichaFormDefaults,
        mode: "onTouched",
    });

    const criar = useMutation(
        trpc.fichaAvaliativa.criarModelo.mutationOptions({
            onSuccess: aoSalvar,
            onError: (erro) => {
                const gerais: string[] = [];
                for (const [campo, mensagens] of Object.entries(
                    erro.data?.fieldErrors ?? {},
                )) {
                    if (!mensagens.length) continue;
                    if (campo === "nome") {
                        form.setError("nome", {
                            type: "server",
                            message: mensagens.join(" "),
                        });
                        continue;
                    }
                    gerais.push(...mensagens);
                }
                setErrosGerais(
                    gerais.length > 0
                        ? gerais
                        : [
                              "Não foi possível criar o modelo. Revise a ficha e tente de novo.",
                          ],
                );
            },
        }),
    );

    function salvar(valores: ModeloFichaFormValues) {
        setErrosGerais([]);
        criar.mutate(paraCriarModeloFicha(valores));
    }

    return {
        form,
        salvar,
        salvando: criar.isPending,
        salvo: criar.isSuccess,
        errosGerais,
    };
}
