import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import gauchinho from "@/public/assets/logo.png";

import { Button } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import { getSession } from "~/shared/api/auth/server";

/**
 * A casca da vitrine.
 *
 * Não espera nada: a marca e o cabeçalho não dependem de quem está olhando, e
 * esta é a primeira tela de quem ainda não conhece o produto — segurá-la pela
 * sessão custa o primeiro render de todas as rotas abaixo. Só o botão da
 * direita sabe quem é o visitante, e é só ele que suspende. Ver `docs/fcp.md`.
 */
export default function VitrineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="bg-background relative min-h-screen">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <Image
                    src={gauchinho}
                    alt="Gauchinho"
                    width={48}
                    height={48}
                    className="rounded-md"
                />

                <span className="truncate font-semibold">Te inscreve</span>

                {/* O esqueleto tem o tamanho do botão para o cabeçalho não
                    pular quando a sessão chega. */}
                <Suspense
                    fallback={
                        <Skeleton className="ml-auto h-8 w-32 rounded-md" />
                    }
                >
                    <AcaoDaSessao />
                </Suspense>
            </header>
            {children}
        </main>
    );
}

/**
 * Entrar ou ir para a administração, conforme haja sessão.
 *
 * Separado do layout porque é a única peça do cabeçalho que depende da rede:
 * assim a espera fica confinada a ele em vez de subir e segurar a página.
 */
async function AcaoDaSessao() {
    const session = await getSession();

    return (
        <Link href={session ? "/admin/eventos" : "/signin"} className="ml-auto">
            <Button
                variant="default"
                size="sm"
                className="hover:cursor-pointer"
            >
                {session ? "Ver administração" : "Entrar"}
            </Button>
        </Link>
    );
}
