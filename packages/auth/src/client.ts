import type { BetterAuthClientPlugin } from "better-auth";

import type { RestCredentialsPlugin } from "./rest-credentials";

/**
 * Client-side counterpart of the `restCredentials` server plugin.
 *
 * It carries no runtime behaviour — it exists so the auth client infers the
 * extra endpoints, giving you typed:
 *
 * ```ts
 * await authClient.signIn.rest({ email, password });
 * await authClient.signUp.rest({
 *     email,
 *     fullName,
 *     cpf,
 *     password,
 *     passwordVerification,
 * });
 * ```
 *
 * better-auth só avisa o `useSession` depois dos próprios caminhos
 * (`/sign-in/email`, `/sign-up/email`…), então os `/rest` acionam o mesmo
 * sinal aqui. Sem isso, a sessão recém-criada só apareceria no próximo
 * `getSession` — o app mobile, que decide a rota pela sessão, ficaria parado no
 * login.
 */
export const restCredentialsClient = () => {
    return {
        id: "rest-credentials",
        $InferServerPlugin: {} as RestCredentialsPlugin,
        atomListeners: [
            {
                signal: "$sessionSignal",
                matcher: (path) =>
                    path === "/sign-in/rest" || path === "/sign-up/rest",
            },
        ],
    } satisfies BetterAuthClientPlugin;
};

export {
    mensagemDeErroDeLogin,
    SemConexaoError,
} from "./mensagem-de-erro-login";
