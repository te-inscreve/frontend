import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@te-inscreve/components";

import { AlternarTema } from "~/features/usuarios/components/alternar-tema";
import { UserDropdown } from "~/features/usuarios/components/user-dropdown";
import { getSession } from "~/shared/api/auth/server";
import { GoBackButton } from "~/shared/ui/back-btn";

export const metadata: Metadata = {
    title: "Configurações | te inscreve",
    description: "Preferências da sua conta no Te Inscreve",
};

/**
 * As configurações da conta. Por enquanto, só a aparência.
 *
 * A sessão é esperada aqui pelo mesmo motivo do `/perfil`: é o portão da
 * página, e sai do cookie, sem rede. Ver `docs/fcp.md`.
 */
export default async function ConfiguracoesPage() {
    const session = await getSession();
    // O proxy já barra quem não tem sessão; isto cobre o cookie que expirou
    // entre uma navegação e outra.
    if (!session) redirect("/signin?next=/configuracoes");

    return (
        <main className="bg-background min-h-screen">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <GoBackButton href="/admin/eventos" />
                <UserDropdown />
            </header>

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
                <div>
                    <h1 className="text-primary text-3xl font-bold tracking-tight md:text-4xl">
                        Configurações
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Ajuste o Te Inscreve do seu jeito.
                    </p>
                </div>

                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Aparência</CardTitle>
                        <CardDescription>
                            Vale só para este navegador.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlternarTema />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
