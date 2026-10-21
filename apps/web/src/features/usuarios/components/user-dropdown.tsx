import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@te-inscreve/components";

import { auth } from "~/shared/api/auth/server";
import { getPerfil } from "../lib/get-perfil";
import { AvatarUsuario } from "./avatar-usuario";

/**
 * O menu do usuário no topbar do painel.
 *
 * Só a sessão é esperada aqui, e ela sai do cookie — sem rede. A foto, que vem
 * de `/profile`, fica atrás de um `Suspense`: sem ele a espera subiria até o
 * boundary acima do layout do `/admin` e seguraria a casca inteira, sidebar
 * junto. Assim o topbar pinta completo e a foto entra depois, por streaming.
 */
export async function UserDropdown() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-full hover:cursor-pointer"
                >
                    <Suspense
                        fallback={
                            <AvatarUsuario
                                nome={session.user.name}
                                size={24}
                                alt=""
                            />
                        }
                    >
                        <FotoDoPerfil nome={session.user.name} />
                    </Suspense>
                    <span className="text-sm font-medium">
                        {session.user.name}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/perfil">
                        <UserIcon size={16} />
                        Ver perfil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/configuracoes">
                        <GearIcon size={16} />
                        Configurações
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild variant="destructive">
                    <Link href="/signout">
                        <SignOutIcon size={16} />
                        Sair
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * A foto do perfil, ou o ícone genérico quando não há uma.
 *
 * O fallback do `Suspense` é este mesmo avatar sem foto: mesmo tamanho, mesma
 * forma, então a troca não desloca nada do topbar. A foto é enfeite — se
 * `/profile` falhar, o menu continua de pé com o ícone em vez de derrubar a
 * página inteira.
 */
async function FotoDoPerfil({ nome }: { nome: string }) {
    const perfil = await getPerfil().catch((erro: unknown) => {
        console.error("[perfil] não foi possível carregar a foto", erro);
        return null;
    });

    return <AvatarUsuario photo={perfil?.photo} nome={nome} size={24} alt="" />;
}
