import { getSession } from "~/shared/auth/server";

export default async function HomePage() {
    const session = await getSession();

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
                <p className="text-sm font-medium">
                    {session
                        ? `Sessão ativa: ${session.user.email}`
                        : "Nenhuma sessão ativa."}
                </p>
            </div>
        </main>
    );
}
