import type { Metadata, Viewport } from "next";

import { cn } from "@te-inscreve/ui";

import { TRPCReactProvider } from "~/shared/api/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
    title: "te inscreve",
    description: "Inscrições e avaliações de eventos",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body
                className={cn(
                    "bg-background min-h-screen font-sans antialiased",
                )}
            >
                <TRPCReactProvider>{props.children}</TRPCReactProvider>
            </body>
        </html>
    );
}
