import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";

import type { Perfil } from "@te-inscreve/schemas";

import { getPerfil } from "~/features/usuarios/lib/get-perfil";
import { formatCpf } from "~/shared/utils/format-cpf";
import { AvatarUsuario } from "./avatar-usuario";
import { DadoDoPerfil } from "./perfil-card";

/**
 * O avatar do perfil, que depende da foto vinda da API.
 *
 * Suspende sozinho para o cabeçalho do cartão pintar com o nome já no lugar. O
 * fallback é o mesmo avatar sem foto — mesmo tamanho, mesma borda —, então a
 * imagem entra sem mover nada. É o que o `UserDropdown` já faz no topbar.
 */
export async function AvatarDoPerfil({ nome }: { nome: string }) {
    const perfil = await lerPerfil();

    return (
        <AvatarUsuario
            photo={perfil.dados?.photo}
            nome={nome}
            size={96}
            className="border"
        />
    );
}

/** O avatar enquanto a foto não chegou: idêntico, só sem a imagem. */
export function AvatarDoPerfilSkeleton({ nome }: { nome: string }) {
    return <AvatarUsuario nome={nome} size={96} className="border" />;
}

/**
 * O CPF e o aviso, quando há um.
 *
 * A página do perfil não deve virar tela de erro: se a API não responder, o
 * que já se sabe da sessão continua visível e o aviso explica o resto. Por
 * isso o `catch` mora aqui, e não num `error.tsx`.
 */
export async function DadosDoPerfil() {
    const { dados, aviso } = await lerPerfil();

    return (
        <>
            <DadoDoPerfil
                icone={<IdentificationCardIcon size={18} weight="duotone" />}
                rotulo="CPF"
                valor={dados ? formatCpf(dados.cpf) : null}
            />

            {aviso ? (
                <p
                    role="alert"
                    className="text-destructive flex items-start gap-2 text-sm"
                >
                    <WarningCircleIcon
                        className="mt-0.5 shrink-0"
                        size={16}
                        aria-hidden="true"
                    />
                    {aviso}
                </p>
            ) : (
                !dados && (
                    <p
                        role="status"
                        className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                        <WarningCircleIcon
                            className="mt-0.5 shrink-0"
                            size={16}
                            aria-hidden="true"
                        />
                        Ainda não há um perfil cadastrado para esta conta. Os
                        dados aparecem aqui assim que forem preenchidos.
                    </p>
                )
            )}
        </>
    );
}

/**
 * A leitura que o avatar e os dados dividem.
 *
 * Os dois suspendem separados mas pedem o mesmo perfil; como o query client é
 * memoizado por requisição, isso é uma ida só à API — o segundo apenas aguarda
 * a promise que o primeiro começou. Ver `docs/fcp.md`.
 */
async function lerPerfil(): Promise<{
    dados: Perfil | null;
    aviso?: string;
}> {
    try {
        return { dados: await getPerfil() };
    } catch (erro) {
        console.error("[perfil] não foi possível carregar o perfil", erro);
        return {
            dados: null,
            aviso: "Não foi possível carregar seus dados agora. Atualize a página em instantes.",
        };
    }
}
