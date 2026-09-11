"use client";

import { useState } from "react";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@te-inscreve/components";

import type { FormGrupo, GrupoDetalhe } from "./grupo";
import { DialogoEditarGrupo } from "./dialogo-editar-grupo";
import { DialogoExcluirGrupo } from "./dialogo-excluir-grupo";

interface Props {
    grupo: GrupoDetalhe;
    onEditar: (dados: FormGrupo) => Promise<void> | void;
    onExcluir: () => void;
}

/**
 * As ações do grupo, atrás dos três pontos do cabeçalho do detalhe.
 *
 * Editar e excluir são ações ocasionais — quem abre um grupo vem montar a
 * formação, e é esse o trabalho que precisa da tela. Soltos no cabeçalho, os
 * dois botões competiam com o assunto e ainda punham a exclusão a um clique de
 * distância; recolhidos, o cabeçalho volta a ser o nome do grupo.
 *
 * Os diálogos vivem fora do menu e são controlados por ele, e os itens seguram
 * o `onSelect`: sem isso o Radix fecha o menu — e o que estivesse dentro dele —
 * antes de o diálogo montar. É o mesmo arranjo de {@link AcoesEvento}.
 */
export function MenuGrupo({ grupo, onEditar, onExcluir }: Props) {
    const [menuAberto, setMenuAberto] = useState(false);
    const [editando, setEditando] = useState(false);
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

    /**
     * Fecha o menu e abre o diálogo pedido.
     *
     * O `preventDefault` tira do Radix o fechamento automático — ele devolveria
     * o foco ao gatilho no mesmo quadro em que o diálogo pede o foco para si, e
     * os dois disputariam. O menu fecha aqui, um passo depois, e é por isso que
     * ele é controlado: sem isso ficaria aberto atrás do diálogo.
     */
    const escolher = (evento: Event, abrir: (aberto: boolean) => void) => {
        evento.preventDefault();
        setMenuAberto(false);
        abrir(true);
    };

    return (
        <>
            <DropdownMenu open={menuAberto} onOpenChange={setMenuAberto}>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Ações do grupo ${grupo.nome}`}
                    >
                        <DotsThreeVerticalIcon
                            aria-hidden="true"
                            weight="bold"
                        />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        onSelect={(evento) => escolher(evento, setEditando)}
                    >
                        <PencilSimpleIcon aria-hidden="true" />
                        Editar grupo
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={(evento) =>
                            escolher(evento, setConfirmandoExclusao)
                        }
                    >
                        <TrashIcon aria-hidden="true" />
                        Excluir grupo
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DialogoEditarGrupo
                grupo={grupo}
                open={editando}
                onOpenChange={setEditando}
                onEditar={onEditar}
            />

            <DialogoExcluirGrupo
                grupo={grupo}
                open={confirmandoExclusao}
                onOpenChange={setConfirmandoExclusao}
                onExcluir={onExcluir}
            />
        </>
    );
}
