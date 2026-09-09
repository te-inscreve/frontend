"use client";

import { useState } from "react";

import {
    ExpandableDialog,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTrigger,
    TableCell,
    TableRow,
} from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { idadeEm } from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";
import { ModalIntegrante, SituacaoMatricula } from "./modal-integrante";

/**
 * Uma pessoa como linha da tabela.
 *
 * O gatilho do modal é a célula do nome, e não a linha: ele é um `button`, e
 * `button` não pode envolver as outras células — nem `tr` pode virar botão. O
 * morph sai de onde o olho já está, no avatar e no nome, que são as âncoras
 * compartilhadas com o cabeçalho do modal.
 *
 * A linha inteira continua clicando: quem usa mouse não mira a primeira
 * coluna. Quem usa teclado chega pelo botão do nome, que é o elemento
 * focável — daí o `has-aria-expanded` do `TableRow` marcar a linha aberta.
 *
 * O `id` diz `linha` porque o cartão usa outro — ver {@link CartaoIntegrante}.
 */
export function LinhaIntegrante({ integrante }: { integrante: Integrante }) {
    const [aberto, setAberto] = useState(false);

    return (
        <ExpandableDialog
            id={`linha-integrante-${integrante.id}`}
            open={aberto}
            onOpenChange={setAberto}
        >
            <TableRow
                className="cursor-pointer"
                onClick={() => setAberto(true)}
            >
                <TableCell className="p-0">
                    <ExpandableDialogTrigger
                        // A célula é uma faixa sem cantos próprios; o
                        // arredondado é uma das coisas que o morph traz.
                        style={{ borderRadius: 0 }}
                        className="focus-visible:ring-ring/50 flex w-full items-center gap-3 p-2 text-left transition-colors focus-visible:ring-2 focus-visible:-outline-offset-2"
                    >
                        <ExpandableDialogIcon className="size-9 bg-transparent">
                            <AvatarUsuario
                                nome={integrante.nome}
                                size={36}
                                alt=""
                            />
                        </ExpandableDialogIcon>

                        <ExpandableDialogLabel className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {integrante.nome}
                        </ExpandableDialogLabel>
                    </ExpandableDialogTrigger>
                </TableCell>

                <TableCell className="text-muted-foreground">
                    {integrante.matriculaCtg}
                </TableCell>

                <TableCell className="tabular-nums">
                    {idadeEm(integrante.dataNascimento)} anos
                </TableCell>

                <TableCell>
                    <SituacaoMatricula integrante={integrante} />
                </TableCell>
            </TableRow>

            <ModalIntegrante integrante={integrante} />
        </ExpandableDialog>
    );
}
