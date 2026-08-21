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

export async function UserDropdown() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return null;

    // A foto é enfeite: se `/profile` falhar, o topbar continua de pé com o
    // ícone genérico em vez de derrubar a página inteira.
    const perfil = await getPerfil().catch((erro: unknown) => {
        console.error("[perfil] não foi possível carregar a foto", erro);
        return null;
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-full hover:cursor-pointer"
                >
                    <AvatarUsuario
                        photo={perfil?.photo}
                        nome={session.user.name}
                        size={24}
                        alt=""
                    />
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
