import { cookies } from "next/headers";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@te-inscreve/components/components/sidebar";

import { AdminEntidadesSidebar } from "~/shared/ui/admin-entidades-sidebar";
import { IconProvider } from "~/shared/ui/icon-provider";

// Espelha o `SIDEBAR_COOKIE_NAME` do componente de sidebar. A constante de lá
// não dá para importar: o módulo é `"use client"`, então em um Server Component
// ela chega como referência de cliente, e não como string.
const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default async function AdminEntidadesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // O provider grava o estado em cookie; lê-lo aqui evita que a sidebar
    // apareça aberta no SSR e feche depois da hidratação.
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

    return (
        <IconProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
                <AdminEntidadesSidebar />
                <SidebarInset className="bg-background relative min-h-screen">
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />

                        <div className="bg-muted ml-auto flex h-8 w-8 items-center justify-center rounded-full">
                            <UserIcon size={18} weight="regular" />
                        </div>
                    </header>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </IconProvider>
    );
}
