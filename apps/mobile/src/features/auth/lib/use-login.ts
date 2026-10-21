import { useMutation } from "@tanstack/react-query";

import type { SignInFormValues } from "@te-inscreve/schemas";
import {
    mensagemDeErroDeLogin,
    SemConexaoError,
} from "@te-inscreve/auth/client";

import { signIn } from "~/utils/auth";

/**
 * Entra com `signIn.rest`. Não navega: o layout raiz troca de rota sozinho
 * quando o `useSession` passa a ter sessão.
 */
export function useLogin() {
    const mutation = useMutation({
        mutationFn: async ({ email, senha }: SignInFormValues) => {
            const { error } = await signIn
                .rest({ email, password: senha })
                .catch((causa: unknown) => {
                    throw new SemConexaoError(causa);
                });

            if (error) {
                throw new Error(error.message, { cause: error });
            }
        },
    });

    return {
        entrar: mutation.mutate,
        /** Tira da tela o erro da tentativa anterior. */
        limparErro: mutation.reset,
        erro: mutation.error ? mensagemDeErroDeLogin(mutation.error) : null,
        enviando: mutation.isPending,
    };
}
