import Image from "next/image";
import Link from "next/link";
import gauchinho from "@/public/assets/logo.png";

import { Button } from "@te-inscreve/components";

import { getSession } from "~/shared/api/auth/server";

export default async function VitrineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

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
                {session ? (
                    <Link href="/admin/eventos" className="ml-auto">
                        <Button
                            variant="default"
                            size="sm"
                            className="hover:cursor-pointer"
                        >
                            Ver administração
                        </Button>
                    </Link>
                ) : (
                    <Link href="/signin" className="ml-auto">
                        <Button
                            variant="default"
                            size="sm"
                            className="hover:cursor-pointer"
                        >
                            Entrar
                        </Button>
                    </Link>
                )}
            </header>
            {children}
        </main>
    );
}
