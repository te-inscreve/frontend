"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { MegaphoneIcon } from "@phosphor-icons/react/dist/ssr/Megaphone";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Separator,
} from "@te-inscreve/components";

import { DialogoExcluirEvento } from "./dialogo-excluir-evento";
import { DialogoPublicarEvento } from "./dialogo-publicar-evento";

interface Props {
    eventoId: number;
}

/**
 * Menu de ações do evento, no cabeçalho da página de detalhe.
 *
 * A publicação e a exclusão são confirmadas em diálogos controlados fora do
 * menu: os itens seguram o `onSelect` para o Radix não fechar tudo antes de o
 * diálogo montar.
 */
export function AcoesEvento({ eventoId }: Props) {
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
    const [confirmandoPublicacao, setConfirmandoPublicacao] = useState(false);

    return (
        <div className="flex flex-col items-end gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm">
                        Ações
                        <Separator orientation="vertical" />
                        <CaretDownIcon aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/eventos/${eventoId}/editar`}>
                            <PencilSimpleIcon aria-hidden="true" />
                            Editar
                        </Link>
                    </DropdownMenuItem>

                    {/* A página pública é a que se compartilha: o link de
                        lá carrega a prévia com o cartaz. */}
                    <DropdownMenuItem asChild>
                        <Link href={`/eventos/${eventoId}`} target="_blank">
                            <ArrowSquareOutIcon aria-hidden="true" />
                            Ver página pública
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={(evento) => {
                            evento.preventDefault();
                            setConfirmandoPublicacao(true);
                        }}
                    >
                        <MegaphoneIcon aria-hidden="true" />
                        Publicar evento
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={(evento) => {
                            evento.preventDefault();
                            setConfirmandoExclusao(true);
                        }}
                    >
                        <TrashIcon aria-hidden="true" />
                        Excluir evento
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DialogoPublicarEvento
                open={confirmandoPublicacao}
                onOpenChange={setConfirmandoPublicacao}
            />

            <DialogoExcluirEvento
                eventoId={eventoId}
                open={confirmandoExclusao}
                onOpenChange={setConfirmandoExclusao}
            />
        </div>
    );
}
