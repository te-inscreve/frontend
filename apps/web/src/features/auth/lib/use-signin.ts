"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { signIn } from "~/shared/api/auth/client";

/**
 * Traduz o erro do better-auth para uma mensagem exibível. O backend fala
 * inglês nas falhas de credencial, então a tradução acontece aqui, na borda
 * da UI.
 */
function mensagemDeErro(erro: unknown): string {
    // O `mutationFn` embrulha a falha do better-auth num `Error` para o React
    // Query; o `status` fica na causa.
    const error = erro instanceof Error && erro.cause ? erro.cause : erro;

    if (
        typeof error !== "object" ||
        error === null ||
        !("status" in error) ||
        typeof error.status !== "number"
    ) {
        return "Não foi possível entrar. Tente novamente mais tarde.";
    }

    // O plugin de auth colapsa 403/404 em 401 de propósito, mas cobrimos os
    // três para não vazar um erro cru caso isso mude.
    if ([401, 403, 404].includes(error.status)) {
        return "E-mail ou senha inválidos.";
    }
    if (error.status === 429) {
        return "Muitas tentativas. Aguarde um instante e tente de novo.";
    }
    // Erros de validação chegam com mensagem do backend, segura de exibir.
    if (
        error.status === 400 &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }
    return "Não foi possível entrar. Tente novamente mais tarde.";
}

export function useSignIn() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: async ({
            email,
            senha,
        }: {
            email: string;
            senha: string;
        }) => {
            const { error } = await signIn.rest({ email, password: senha });

            if (error) {
                throw new Error(error.message, { cause: error });
            }
        },
        onSuccess: () => {
            router.push(searchParams.get("next") ?? "/");
            router.refresh();
        },
    });

    function entrar(email: string, senha: string) {
        mutation.mutate({ email, senha });
    }

    return {
        entrar,
        erro: mutation.error ? mensagemDeErro(mutation.error) : null,
        enviando: mutation.isPending,
        ...mutation,
    };
}
