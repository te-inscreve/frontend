import Image from "next/image";
import Link from "next/link";
import gauchinho from "@/public/assets/logo.png";

/**
 * A casca da vitrine.
 *
 * Não espera nada: a marca não depende de quem está olhando, e esta é a
 * primeira tela de quem ainda não conhece o produto. O que muda com a sessão
 * fica nas páginas, cada coisa atrás do próprio boundary. Ver `docs/fcp.md`.
 */
export default function VitrineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="bg-background relative min-h-screen">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src={gauchinho}
                        alt="Gauchinho"
                        width={48}
                        height={48}
                        className="rounded-md"
                    />

                    <span className="truncate font-semibold">Te inscreve</span>
                </Link>
            </header>
            {children}
        </main>
    );
}
