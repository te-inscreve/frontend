"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    buttonVariants,
    cn,
} from "@te-inscreve/components";

import type { GrupoDetalhe } from "./grupo";
import { contagemIntegrantes } from "./grupo";

/**
 * Confirmação da exclusão de um grupo.
 *
 * `AlertDialog` comum: confirmação destrutiva não é a continuação de nada
 * visível na tela — é uma interrupção, e é disso que ela precisa. Ver a seção 2
 * de `docs/animacoes.md`.
 *
 * A abertura vem de fora porque quem a pede é um item do {@link MenuGrupo}, que
 * some junto com o menu.
 *
 * Sem o gesto de segurar do `HoldToAct` que a exclusão de evento usa: aqui não
 * se perde cadastro nenhum. O grupo é só o agrupamento, e as pessoas continuam
 * na entidade — é o que a descrição diz, para a confirmação não parecer mais
 * grave do que é.
 */
export function DialogoExcluirGrupo({
    grupo,
    open,
    onOpenChange,
    onExcluir,
}: {
    grupo: GrupoDetalhe;
    open: boolean;
    onOpenChange: (aberto: boolean) => void;
    onExcluir: () => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Excluir o grupo {grupo.nome}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        O grupo sai da lista e não poderá mais ser inscrito em
                        eventos.
                        {grupo.totalIntegrantes > 0 &&
                            ` ${contagemIntegrantes(grupo.totalIntegrantes)} ${
                                grupo.totalIntegrantes === 1
                                    ? "continua"
                                    : "continuam"
                            } cadastrados na entidade — só o agrupamento deixa de existir.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(
                            buttonVariants({ variant: "destructive" }),
                        )}
                        onClick={onExcluir}
                    >
                        <TrashIcon aria-hidden="true" />
                        Excluir grupo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
