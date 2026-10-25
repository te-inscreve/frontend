import type { Metadata, Viewport } from "next";

import { TRPCReactProvider } from "~/shared/api/trpc/client";

import "~/app/styles.css";

import { cn } from "@te-inscreve/components";

import { IconProvider } from "~/shared/ui/icon-provider";
import { ThemeProvider } from "~/shared/ui/theme-provider";
import { siteUrl } from "~/shared/utils/site-url";

const descricao =
    "Inscrições e avaliações de eventos de danças gaúchas: dos grupos artísticos às notas dos avaliadores.";

/**
 * O padrão de todas as páginas. Quem define o próprio `openGraph` substitui o
 * bloco inteiro — o Next não mescla objetos aninhados —, então a página de
 * evento repete aqui o que precisar.
 */
export const metadata: Metadata = {
    metadataBase: siteUrl,
    title: "Te Inscreve",
    description: descricao,
    applicationName: "Te Inscreve",
    openGraph: {
        type: "website",
        locale: "pt_BR",
        siteName: "Te Inscreve",
        title: "Te Inscreve",
        description: descricao,
        images: [
            {
                url: "/assets/gauchinho.png",
                width: 500,
                height: 500,
                alt: "Gauchinho, o mascote do Te Inscreve",
            },
        ],
    },
    twitter: {
        card: "summary",
    },
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
    themeColor: "white",
};

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body
                className={cn(
                    "bg-background min-h-screen font-sans antialiased",
                )}
            >
                <ThemeProvider>
                    <TRPCReactProvider>
                        <IconProvider>{props.children}</IconProvider>
                    </TRPCReactProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
