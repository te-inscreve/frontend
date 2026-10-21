"use client";

import type { UseFormSetError } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import type { SignUpFormValues } from "./signup-schema";
import { signUp } from "~/shared/api/auth/client";
import { destinoPosAuth } from "./destino-pos-auth";

type CampoDoFormulario = keyof SignUpFormValues;

/**
 * Nome do campo na API → nome do campo no formulário.
 *
 * O backend responde a um 400 com um dicionário por campo
 * (`{ "email": ["A user with this email already exists."] }`) usando os nomes
 * dele; o formulário usa os nomes em português. Nada fora deste mapa vira erro
 * de campo — mensagem de campo desconhecido sobe para o alerta do formulário
 * em vez de sumir.
 */
const CAMPO_POR_NOME_NA_API: Record<string, CampoDoFormulario> = {
    email: "email",
    fullName: "nomeCompleto",
    cpf: "cpf",
    password: "senha",
    passwordVerification: "confirmacaoSenha",
};

interface ErroDeCadastro {
    /** Mensagem do alerta geral. `null` quando tudo coube nos campos. */
    mensagem: string | null;
    /** Mensagens da API já apontadas para os campos do formulário. */
    campos: { campo: CampoDoFormulario; mensagem: string }[];
}

const GENERICA = "Não foi possível criar a conta. Tente novamente.";

/**
 * Lê o `fieldErrors` que o plugin de auth anexa às recusas de validação.
 *
 * Confere o formato em vez de confiar no tipo: isso aqui é JSON que chegou pela
 * rede, e uma string onde deveria haver uma lista viraria uma mensagem de uma
 * letra só na tela.
 */
function primeiraMensagemPorCampo(error: object): Record<string, string> {
    if (!("fieldErrors" in error) || typeof error.fieldErrors !== "object") {
        return {};
    }

    const mensagens: Record<string, string> = {};
    for (const [campo, valor] of Object.entries(error.fieldErrors ?? {})) {
        const primeira: unknown = Array.isArray(valor) ? valor[0] : valor;
        if (typeof primeira === "string" && primeira.trim()) {
            mensagens[campo] = primeira;
        }
    }
    return mensagens;
}

/**
 * Reduz o erro do better-auth ao que a tela precisa mostrar: o que é de um campo
 * vai para o campo, o resto vira alerta.
 *
 * As mensagens da API são exibidas como vieram — quem as escreve no idioma do
 * usuário é o backend. Só as frases que não vêm de lá (falha de rede, excesso de
 * tentativas) estão em português aqui.
 */
function interpretarErro(erro: unknown): ErroDeCadastro {
    // O `mutationFn` embrulha a falha do better-auth num `Error` para o React
    // Query; o corpo da resposta fica na causa.
    const error = erro instanceof Error && erro.cause ? erro.cause : erro;

    if (
        typeof error !== "object" ||
        error === null ||
        !("status" in error) ||
        typeof error.status !== "number"
    ) {
        return { mensagem: GENERICA, campos: [] };
    }

    if (error.status === 429) {
        return {
            mensagem: "Muitas tentativas. Aguarde um instante e tente de novo.",
            campos: [],
        };
    }

    // 400 e 409 são recusas que o usuário consegue corrigir, e só elas trazem
    // detalhe por campo.
    if (error.status === 400 || error.status === 409) {
        const campos: ErroDeCadastro["campos"] = [];
        const avulsas: string[] = [];

        for (const [nomeNaApi, mensagem] of Object.entries(
            primeiraMensagemPorCampo(error),
        )) {
            const campo = CAMPO_POR_NOME_NA_API[nomeNaApi];
            if (campo) campos.push({ campo, mensagem });
            else avulsas.push(mensagem);
        }

        // Sem detalhe por campo (ou com detalhe que não é de nenhum campo da
        // tela), sobra a mensagem que o backend mandou — ela é segura de exibir.
        const mensagemDoCorpo =
            "message" in error && typeof error.message === "string"
                ? error.message
                : null;

        if (campos.length === 0) {
            return {
                mensagem: avulsas[0] ?? mensagemDoCorpo ?? GENERICA,
                campos: [],
            };
        }

        // Com os campos já marcados, repetir a mesma frase no alerta só
        // duplicaria o aviso.
        return { mensagem: avulsas[0] ?? null, campos };
    }

    return { mensagem: GENERICA, campos: [] };
}

export function useSignUp({
    setError,
}: {
    /** `setError` do formulário: é por ele que a recusa da API vira erro de campo. */
    setError: UseFormSetError<SignUpFormValues>;
}) {
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: async (valores: SignUpFormValues) => {
            const { error } = await signUp.rest({
                email: valores.email,
                fullName: valores.nomeCompleto,
                cpf: valores.cpf,
                password: valores.senha,
                passwordVerification: valores.confirmacaoSenha,
            });

            if (error) {
                throw new Error(error.message, { cause: error });
            }
        },
        onError: (erro) => {
            const { campos } = interpretarErro(erro);

            campos.forEach(({ campo, mensagem }, indice) =>
                setError(
                    campo,
                    { type: "server", message: mensagem },
                    // Leva o foco para o primeiro campo recusado, como a
                    // validação do próprio formulário faz.
                    { shouldFocus: indice === 0 },
                ),
            );
        },
        // O cadastro já devolve o JWT, então a conta entra logada: não faz
        // sentido devolver o usuário para o login.
        onSuccess: () => {
            router.push(destinoPosAuth());
            router.refresh();
        },
    });

    function cadastrar(valores: SignUpFormValues) {
        mutation.mutate(valores);
    }

    return {
        cadastrar,
        erro: mutation.error ? interpretarErro(mutation.error).mensagem : null,
        enviando: mutation.isPending,
        ...mutation,
    };
}
