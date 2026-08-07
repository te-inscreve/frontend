"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "~/shared/api/auth/client";

/**
 * Traduz o erro do better-auth para uma mensagem exibível. O backend fala
 * inglês nas falhas de credencial, então a tradução acontece aqui, na borda
 * da UI.
 */
function mensagemDeErro(error: { status: number; message?: string }): string {
    // O plugin de auth colapsa 403/404 em 401 de propósito, mas cobrimos os
    // três para não vazar um erro cru caso isso mude.
    if ([401, 403, 404].includes(error.status)) {
        return "E-mail ou senha inválidos.";
    }
    if (error.status === 429) {
        return "Muitas tentativas. Aguarde um instante e tente de novo.";
    }
    // Erros de validação chegam com mensagem do backend, segura de exibir.
    if (error.status === 400 && error.message) {
        return error.message;
    }
    return "Não foi possível entrar. Tente novamente mais tarde.";
}

export function useSignIn() {
    const router = useRouter();
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    async function entrar(email: string, senha: string) {
        setErro(null);
        setEnviando(true);

        const { error } = await signIn.rest({ email, password: senha });

        if (error) {
            setErro(mensagemDeErro(error));
            setEnviando(false);
            return;
        }

        // `refresh` para os layouts de servidor (ex.: header da vitrine)
        // relerem a sessão recém-criada.
        router.push("/");
        router.refresh();
    }

    return { entrar, erro, enviando };
}
