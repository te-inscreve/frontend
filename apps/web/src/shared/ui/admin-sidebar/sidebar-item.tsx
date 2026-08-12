"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuSub,
} from "@te-inscreve/components/components/sidebar";

import type { ItemNavegacao } from "./items-map";
import { DynamicIcon } from "./icons-map";

interface Props {
    item: ItemNavegacao;
    subItens?: ItemNavegacao[];
    isSubItem?: boolean;
}
export function SidebarItem({ item, subItens, isSubItem }: Props) {
    const pathname = usePathname();

    const ativo =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

    const MenuItem = isSubItem ? SidebarMenuSub : SidebarMenu;

    return (
        <MenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={ativo} tooltip={item.titulo}>
                <Link href={item.href}>
                    <DynamicIcon
                        iconName={item.icone}
                        render={(icone) => {
                            const Icone = icone;
                            return (
                                <Icone
                                    size={18}
                                    weight={ativo ? "duotone" : "regular"}
                                />
                            );
                        }}
                    />

                    <span>{item.titulo}</span>
                </Link>
            </SidebarMenuButton>
            {subItens && subItens.length > 0 && (
                <SidebarMenuSub>
                    {subItens.map((subItem) => (
                        <SidebarItem key={subItem.href} item={subItem} />
                    ))}
                </SidebarMenuSub>
            )}
        </MenuItem>
    );
}
