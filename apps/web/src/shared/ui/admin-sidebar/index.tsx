import "server-only";

import Image from "next/image";
import Link from "next/link";
import gauchinho from "@/public/assets/logo.png";

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

import { itensMap } from "./items-map";
import { SidebarItem } from "./sidebar-item";

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/minha-entidade">
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
                {itensMap.map(({ titulo, itens }, index) => (
                    <SidebarGroup key={`${titulo}-${index}`}>
                        {titulo && (
                            <SidebarGroupLabel>{titulo}</SidebarGroupLabel>
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {itens.map((item) => {
                                    return (
                                        <SidebarItem
                                            key={item.href}
                                            item={item}
                                            subItens={item.subItens}
                                        />
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
