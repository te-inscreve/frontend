import type { Metadata } from "next";
import Image from "next/image";
import gauchinho from "@/public/assets/gauchinho.png";

import { SignUpForm } from "~/features/auth/components/signup-form";

export const metadata: Metadata = {
    title: "Criar conta | te inscreve",
};

export default function SignUpPage() {
    return (
        <main className="bg-background flex min-h-screen items-center justify-center p-4">
            <div className="bg-card flex w-full max-w-4xl overflow-hidden rounded-2xl border shadow-lg">
                <aside className="bg-primary text-primary-foreground hidden w-1/2 flex-col items-center justify-between gap-8 px-8 py-12 md:flex">
                    <h1 className="text-3xl font-bold tracking-[0.2em]">
                        TE INSCREVE
                    </h1>
                    <Image
                        src={gauchinho}
                        alt="Gauchinho, mascote do Te Inscreve"
                        width={260}
                        priority
                    />
                    <p className="text-center text-lg font-medium">
                        &ldquo;Toda dança merece ser avaliada&rdquo;
                    </p>
                </aside>

                <section className="flex w-full flex-col items-center justify-center gap-8 px-8 py-16 md:w-1/2 md:px-12">
                    <Image
                        src={gauchinho}
                        alt="Gauchinho, mascote do Te Inscreve"
                        width={96}
                        priority
                        className="md:hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-3xl font-semibold">Criar conta</h2>
                        <p className="text-muted-foreground text-center text-sm">
                            Cadastre-se para inscrever artistas e acompanhar
                            eventos.
                        </p>
                    </div>
                    <div className="w-full max-w-xs">
                        <SignUpForm />
                    </div>
                </section>
            </div>
        </main>
    );
}
