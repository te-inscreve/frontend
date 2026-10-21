import { Suspense } from "react";

import { Skeleton } from "@te-inscreve/components/skeleton";

import { getSession } from "~/shared/api/auth/server";

/**
 * A página inicial da vitrine.
 *
 * Síncrona de propósito: o texto é o mesmo para todo mundo e é o que precisa
 * aparecer primeiro. Só a caixa de sessão espera a rede, atrás do próprio
 * boundary. Ver `docs/fcp.md`.
 */
export default function HomePage() {
    return (
        <main className="container mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-16">
            <h1 className="text-4xl font-bold tracking-tight">
                te <span className="text-primary">inscreve</span>
            </h1>

            <p className="text-muted-foreground">
                Monorepo pronto. O tRPC roda em <code>/api/trpc</code> e repassa
                tudo para a API REST — não há banco de dados aqui.
            </p>

            <div className="rounded-lg border p-4">
                <Suspense fallback={<Skeleton className="h-5 w-56" />}>
                    <EstadoDaSessao />
                </Suspense>
            </div>
        </main>
    );
}

async function EstadoDaSessao() {
    const session = await getSession();

    return (
        <p className="text-sm font-medium">
            {session
                ? `Sessão ativa: ${session.user.email}`
                : "Nenhuma sessão ativa."}
        </p>
    );
}
