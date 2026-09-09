import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Skeleton } from "@te-inscreve/components/skeleton";

import { PerfilCard } from "~/features/usuarios/components/perfil-card";
import {
    AvatarDoPerfil,
    AvatarDoPerfilSkeleton,
    DadosDoPerfil,
} from "~/features/usuarios/components/perfil-da-api";
import { UserDropdown } from "~/features/usuarios/components/user-dropdown";
import { getSession } from "~/shared/api/auth/server";
import { GoBackButton } from "~/shared/ui/back-btn";

export const metadata: Metadata = {
    title: "Meu perfil | te inscreve",
    description: "Dados da sua conta no Te Inscreve",
};

/**
 * A página do perfil.
 *
 * A sessão é esperada aqui, e não atrás de um boundary, porque ela é o portão:
 * sem ela a página não existe, e não dá para pintar conteúdo antes de saber se
 * ele deve aparecer. Ela sai do cookie, sem rede. A leitura da API — foto e
 * CPF — é que desce para os componentes suspensos. Ver `docs/fcp.md`.
 */
export default async function PerfilPage() {
    const session = await getSession();
    // O proxy já barra quem não tem sessão; isto cobre o intervalo entre o
    // cookie expirar e a próxima navegação, e estreita o tipo.
    if (!session) redirect("/signin?next=/perfil");

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
                    avatar={
                        <Suspense
                            fallback={
                                <AvatarDoPerfilSkeleton
                                    nome={session.user.name}
                                />
                            }
                        >
                            <AvatarDoPerfil nome={session.user.name} />
                        </Suspense>
                    }
                    dados={
                        // O esqueleto tem a altura da linha de dado — ícone,
                        // rótulo e valor — para o botão abaixo não pular.
                        <Suspense fallback={<Skeleton className="h-10 w-48" />}>
                            <DadosDoPerfil />
                        </Suspense>
                    }
                />
            </div>
        </main>
    );
}
