import type { Metadata } from "next";
import { redirect } from "next/navigation";

import type { Perfil } from "@te-inscreve/schemas";

import { PerfilCard } from "~/features/usuarios/components/perfil-card";
import { UserDropdown } from "~/features/usuarios/components/user-dropdown";
import { getPerfil } from "~/features/usuarios/lib/get-perfil";
import { getSession } from "~/shared/api/auth/server";
import { GoBackButton } from "~/shared/ui/back-btn";

export const metadata: Metadata = {
    title: "Meu perfil | te inscreve",
    description: "Dados da sua conta no Te Inscreve",
};

export default async function PerfilPage() {
    const session = await getSession();
    // O proxy já barra quem não tem sessão; isto cobre o intervalo entre o
    // cookie expirar e a próxima navegação, e estreita o tipo.
    if (!session) redirect("/signin?next=/perfil");

    // A página do perfil não deve virar tela de erro: se a API não responder,
    // o que já se sabe da sessão continua visível e o aviso explica o resto.
    let perfil: Perfil | null = null;
    let aviso: string | undefined;
    try {
        perfil = await getPerfil();
    } catch (erro) {
        console.error("[perfil] não foi possível carregar o perfil", erro);
        aviso =
            "Não foi possível carregar seus dados agora. Atualize a página em instantes.";
    }

    return (
        <main className="bg-background min-h-screen">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <GoBackButton href="/admin/eventos" />
                <UserDropdown />
            </header>

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
                <div>
                    <h1 className="text-primary text-3xl font-bold tracking-tight md:text-4xl">
                        Meu perfil
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Os dados que identificam você no Te Inscreve.
                    </p>
                </div>

                <PerfilCard
                    nome={session.user.name}
                    email={session.user.email}
                    perfil={perfil}
                    aviso={aviso}
                />
            </div>
        </main>
    );
}
