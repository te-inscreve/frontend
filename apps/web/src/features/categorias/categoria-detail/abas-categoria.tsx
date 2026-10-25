"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs } from "@te-inscreve/components";

import type { AbaCategoria } from "./lib/aba-categoria";

interface Props {
    abaInicial: AbaCategoria;
    className?: string;
    children: React.ReactNode;
}

/**
 * As abas do painel principal da categoria, com a escolhida no `?aba=`: quem
 * recarrega ou compartilha o link volta à mesma aba.
 *
 * Os painéis continuam Server Components, vindos como `children`; só a troca
 * de aba roda no cliente.
 */
export function AbasCategoria({ abaInicial, className, children }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /**
     * Replace, e não push, para a troca de aba não encher o histórico; sem
     * rolar, porque a página fica onde está. A aba padrão sai da URL.
     */
    const aoTrocar = useCallback(
        (aba: string) => {
            const params = new URLSearchParams(searchParams);
            if (aba === "inscritos") params.delete("aba");
            else params.set("aba", aba);
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
            });
        },
        [router, pathname, searchParams],
    );

    return (
        <Tabs
            defaultValue={abaInicial}
            onValueChange={aoTrocar}
            className={className}
        >
            {children}
        </Tabs>
    );
}
