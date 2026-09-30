import type { ReactNode } from "react";
import { Fragment } from "react";
import Link from "next/link";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@te-inscreve/components";

export interface TrilhaPasso {
    label: string;
    /** Sem `href`, o passo é o degrau atual: texto puro, sem link. */
    href?: string;
    /**
     * Desenha o degrau no lugar do texto ou do link — para quando ele faz
     * mais do que navegar, como abrir um seletor. `label` continua sendo a
     * chave do passo.
     */
    conteudo?: ReactNode;
}

interface Props {
    passos: TrilhaPasso[];
}

/**
 * Trilha genérica: monta um `Breadcrumb` a partir de uma lista de passos,
 * sem tamanho fixo. Cada tela que precisar de uma trilha decide os passos e
 * busca os dados deles; este componente só sabe desenhar.
 */
export function TrilhaBuilder({ passos }: Props) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {passos.map((passo, index) => (
                    <Fragment key={`${index}-${passo.label}`}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                            {passo.conteudo !== undefined ? (
                                passo.conteudo
                            ) : passo.href === undefined ? (
                                <BreadcrumbPage>{passo.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={passo.href}>{passo.label}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
