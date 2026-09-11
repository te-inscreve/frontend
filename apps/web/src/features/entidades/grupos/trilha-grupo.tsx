"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@te-inscreve/components";

/**
 * A trilha "Grupos › nome do grupo" do detalhe.
 *
 * O primeiro degrau é um `button`, e não um link: o detalhe não é outra rota —
 * é a mesma tela mostrando o grupo em vez da grade, para a coluna de
 * integrantes não recarregar a cada grupo aberto. A trilha existe porque sem ela
 * o detalhe pareceria uma página nova sem volta; com ela, dá para ver onde se
 * está e voltar no mesmo gesto.
 */
export function TrilhaGrupo({
    nome,
    onVoltar,
}: {
    nome: string;
    onVoltar: () => void;
}) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <button
                            type="button"
                            onClick={onVoltar}
                            className="cursor-pointer"
                        >
                            Grupos
                        </button>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <BreadcrumbItem>
                    <BreadcrumbPage>{nome}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}
