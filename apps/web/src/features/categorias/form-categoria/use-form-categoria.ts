"use client";

import type { FieldPath } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { Categoria } from "@te-inscreve/schemas";

import type { CategoriaFormValues } from "./categoria-form-schema";
import {
    revalidarCategoria,
    revalidarModalidade,
} from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    categoriaFormDefaults,
    categoriaFormInput,
    categoriaFormSchema,
    categoriaFormValues,
} from "./categoria-form-schema";

interface Props {
    /** Evento e modalidade donos da categoria — vêm da rota, não do formulário. */
    eventoId: number;
    modalidadeId: number;
    /** Categoria em edição. Ausente quando o formulário está criando. */
    categoria?: Categoria;
    onSuccess?: (categoria: Categoria) => void;
}

/**
 * Estado do formulário de categoria e o envio para a API, separados da tela.
 * É o irmão de `useFormModalidade` para a categoria criada sozinha, depois que
 * a modalidade já existe.
 */
export function useFormCategoria({
    eventoId,
    modalidadeId,
    categoria,
    onSuccess,
}: Props) {
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [salvamento, setSalvamento] = useState<
        "idle" | "loading" | "success"
    >("idle");

    const form = useForm<CategoriaFormValues>({
        resolver: zodResolver(categoriaFormSchema),
        // Editando, os campos já nascem com o que a API devolveu.
        defaultValues: categoria
            ? categoriaFormValues(categoria)
            : categoriaFormDefaults,
        mode: "onTouched",
    });

    // A criação e a edição só divergem no endereço; o resto é idêntico, então
    // os dois callbacks são escritos uma vez e passados a cada mutação. Eles
    // ficam como funções, e não como um objeto de opções compartilhado, para o
    // tRPC continuar inferindo o tipo do erro de cada rota.
    async function aoSalvar(salva: Categoria) {
        setSalvamento("success");

        // A fila de categorias é montada no servidor, a partir de
        // `modalidade.getById`. É o cache *do servidor* que precisa cair: sem
        // isto o `router.refresh()` de quem chama repinta a fila com a
        // resposta anterior, e a categoria recém-criada só apareceria quando
        // os 30 segundos de `revalidate` expirassem. Na edição o detalhe da
        // própria categoria também envelheceu.
        if (categoria) {
            await revalidarCategoria(eventoId, modalidadeId, categoria.id);
        } else {
            await revalidarModalidade(eventoId, modalidadeId);
        }

        // O cliente ainda não assina estas queries em tela nenhuma, mas o
        // `queryClient` é o mesmo se alguma delas passar a ser buscada no
        // navegador — e aí ficaria velho.
        await queryClient.invalidateQueries(
            trpc.modalidade.getById.queryFilter({ eventoId, modalidadeId }),
        );

        if (categoria) {
            await queryClient.invalidateQueries(
                trpc.categoria.getById.queryFilter({
                    eventoId,
                    modalidadeId,
                    categoriaId: categoria.id,
                }),
            );
        }

        onSuccess?.(salva);
    }

    function aoFalhar(
        fieldErrors: Record<string, string[]> | null | undefined,
    ) {
        setSalvamento("idle");

        for (const [campo, mensagens] of Object.entries(fieldErrors ?? {})) {
            const campoDoFormulario = campoCategoriaForm(campo);
            if (!campoDoFormulario || !mensagens.length) continue;

            form.setError(campoDoFormulario, {
                type: "server",
                message: mensagens.join(" "),
            });
        }
    }

    const criarCategoria = useMutation(
        trpc.categoria.create.mutationOptions({
            onSuccess: aoSalvar,
            onError: (error) => aoFalhar(error.data?.fieldErrors),
        }),
    );

    const editarCategoria = useMutation(
        trpc.categoria.update.mutationOptions({
            onSuccess: aoSalvar,
            onError: (error) => aoFalhar(error.data?.fieldErrors),
        }),
    );

    function salvar(valoresValidos: CategoriaFormValues) {
        setSalvamento("loading");
        const dados = categoriaFormInput(valoresValidos);

        if (categoria) {
            editarCategoria.mutate({
                eventoId,
                modalidadeId,
                categoriaId: categoria.id,
                categoria: dados,
            });
            return;
        }

        criarCategoria.mutate({ eventoId, modalidadeId, categoria: dados });
    }

    return {
        form,
        salvamento,
        salvar,
        erro: categoria ? editarCategoria.error : criarCategoria.error,
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
        // O backend recebe um instante só; o erro dele cai no dia, que é o
        // campo que o organizador procura primeiro.
        dataApresentacao: "diaApresentacao",
        data_apresentacao: "diaApresentacao",
    };

    return campos[campoApi] ?? null;
}
