import type { Metadata, Viewport } from "next";

import { cn } from "@te-inscreve/ui";

import { TRPCReactProvider } from "~/shared/api/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
    title: "te inscreve",
    description: "Inscrições e avaliações de eventos",
    icons: {
        icon: [
            {
                url: "/favicon/favicon-96x96.png?v=20260805",
                type: "image/png",
                sizes: "96x96",
            },
            {
                url: "/favicon/favicon.svg?v=20260805",
                type: "image/svg+xml",
            },
        ],

        // Fica na raiz porque navegadores e crawlers antigos pedem /favicon.ico direto.
        shortcut: ["/favicon.ico?v=20260805"],
        apple: [
            {
                url: "/favicon/apple-touch-icon.png?v=20260805",
                sizes: "180x180",
            },
        ],
    },
    manifest: "/favicon/site.webmanifest?v=20260805",
    appleWebApp: {
        title: "Te Inscreve",
    },
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
