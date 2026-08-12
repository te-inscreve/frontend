import type { Metadata } from "next";
import Image from "next/image";
import gauchinho from "@/public/assets/gauchinho.png";

import { SignInForm } from "~/features/auth/components/signin-form";

export const metadata: Metadata = {
    title: "Login | te inscreve",
};

export default function SignInPage() {
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
                    <h2 className="text-3xl font-semibold">Entrar</h2>
                    <div className="w-full max-w-xs">
                        <SignInForm />
                    </div>
                </section>
            </div>
        </main>
    );
}
