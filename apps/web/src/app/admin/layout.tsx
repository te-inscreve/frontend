import { cookies } from "next/headers";

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@te-inscreve/components/components/sidebar";

import { UserDropdown } from "~/features/usuarios/components/user-dropdown";
import { AdminSidebar } from "~/shared/ui/admin-sidebar";
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
                <AdminSidebar />
                <SidebarInset className="bg-background relative h-svh min-h-0 overflow-hidden">
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />

                        <UserDropdown />
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </IconProvider>
    );
}
