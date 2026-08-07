"use client";

import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gauchinho from "@/public/assets/logo.png";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@te-inscreve/components/components/sidebar";

interface ItemNavegacao {
    titulo: string;
    href: string;
    icone: Icon;
}

const itens: ItemNavegacao[] = [
    {
        titulo: "Minha entidade",
        href: "/minha-entidade",
        icone: BuildingsIcon,
    },
    {
        titulo: "Eventos",
        href: "/eventos",
        icone: CalendarDotsIcon,
    },
];

export function AdminEntidadesSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/minha-entidade">
                                <Image
                                    src={gauchinho}
                                    alt="Gauchinho"
                                    width={48}
                                    height={48}
                                    className="rounded-md"
                                />

                                <span className="truncate font-semibold">
                                    Te inscreve
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {itens.map((item) => {
                                const Icone = item.icone;
                                // O item continua ativo nas rotas filhas, como
                                // `/eventos/[slug]`.
                                const ativo =
                                    pathname === item.href ||
                                    pathname.startsWith(`${item.href}/`);

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={ativo}
                                            tooltip={item.titulo}
                                        >
                                            <Link href={item.href}>
                                                <Icone
                                                    size={18}
                                                    weight={
                                                        ativo
                                                            ? "duotone"
                                                            : "regular"
                                                    }
                                                />
                                                <span>{item.titulo}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
