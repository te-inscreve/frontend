"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSubItem,
} from "@te-inscreve/components/components/sidebar";

import type { ItemNavegacao } from "./items-map";
import { DynamicIcon } from "./icons-map";

interface Props {
    item: ItemNavegacao;
    /** Linha dentro de um `SidebarMenuSub`, e não do menu de primeiro nível. */
    subItem?: boolean;
    /** O submenu do item, quando houver. */
    children?: React.ReactNode;
}

/**
 * Uma linha da sidebar do painel.
 *
 * Cliente por causa do `usePathname`: o destaque do item ativo é a única coisa
 * aqui que depende do navegador. O submenu chega por `children` em vez de sair
 * de uma recursão sobre os subitens — assim quem monta a árvore é o servidor, e
 * um submenu pode ficar atrás de um `Suspense` sem arrastar esta linha junto.
 */
export function SidebarItem({ item, subItem, children }: Props) {
    const pathname = usePathname();

    const ativo =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

    const Wrapper = subItem ? SidebarMenuSubItem : SidebarMenuItem;

    return (
        <Wrapper className="flex flex-col gap-1">
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

            {children}
        </Wrapper>
    );
}
