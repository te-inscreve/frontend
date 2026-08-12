import { use } from "react";
import { headers } from "next/headers";
import Link from "next/link";
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

export function UserDropdown() {
    const _headers = use(headers());
    const session = use(
        auth.api.getSession({
            headers: _headers,
        }),
    );
    if (!session) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-full hover:cursor-pointer"
                >
                    <UserIcon size={18} weight="regular" />
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
                    <Link href="/signout">
                        <SignOutIcon size={16} />
                        Sair
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
