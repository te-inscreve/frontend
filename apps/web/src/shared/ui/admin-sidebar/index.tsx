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

import { ItemComEntidade } from "./item-com-entidade";
import { itensMap } from "./items-map";
import { SidebarItem } from "./sidebar-item";
import { SubItens } from "./sub-itens";

/**
 * Sidebar do painel.
 *
 * Não espera nada: o mapa de itens é estático e o que depende do perfil — os
 * subitens de quem tem vínculo com uma entidade — fica atrás do `Suspense` do
 * {@link SubItens}. Um `await` aqui subiria até o boundary acima do layout do
 * `/admin` e seguraria a casca inteira.
 */
export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href="/admin/minha-entidade"
                                className="flex items-center gap-2"
                            >
                                <Image
                                    src={gauchinho}
                                    alt="Gauchinho"
                                    width={48}
                                    height={48}
                                    className="rounded-md"
                                />

                                <div className="truncate text-xl font-bold">
                                    Te{` `}
                                    <span className="text-primary">
                                        Inscreve
                                    </span>
                                </div>
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
                                {itens.map((item) =>
                                    item.exigeEntidade ? (
                                        <ItemComEntidade
                                            key={item.href}
                                            item={item}
                                        />
                                    ) : (
                                        <SidebarItem
                                            key={item.href}
                                            item={item}
                                        >
                                            <SubItens item={item} />
                                        </SidebarItem>
                                    ),
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
