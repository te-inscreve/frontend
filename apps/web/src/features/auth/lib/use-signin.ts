"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import {
    mensagemDeErroDeLogin,
    SemConexaoError,
} from "@te-inscreve/auth/client";

import { signIn } from "~/shared/api/auth/client";
import { destinoPosAuth } from "./destino-pos-auth";

export function useSignIn() {
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: async ({
            email,
            senha,
        }: {
            email: string;
            senha: string;
        }) => {
            const { error } = await signIn
                .rest({ email, password: senha })
                .catch((causa: unknown) => {
                    throw new SemConexaoError(causa);
                });

            if (error) {
                throw new Error(error.message, { cause: error });
            }
        },
        onSuccess: () => {
            router.push(destinoPosAuth());
            router.refresh();
        },
    });

    function entrar(email: string, senha: string) {
        mutation.mutate({ email, senha });
    }

    return {
        entrar,
        erro: mutation.error ? mensagemDeErroDeLogin(mutation.error) : null,
        enviando: mutation.isPending,
        ...mutation,
    };
}
