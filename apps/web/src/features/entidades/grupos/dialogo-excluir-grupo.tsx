"use client";

import { useState } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
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
 *
 * O botão segura o fechamento (`preventDefault`) até o `DELETE` responder:
 * fechar antes deixaria a tela voltar para a grade com o grupo ainda lá, e um
 * erro sem lugar para aparecer. Enquanto espera, o spinner — é ação, não
 * estrutura.
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
    onExcluir: () => Promise<void> | void;
}) {
    const [excluindo, setExcluindo] = useState(false);

    const excluir = async () => {
        setExcluindo(true);
        try {
            await onExcluir();
            onOpenChange(false);
        } finally {
            setExcluindo(false);
        }
    };

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
                    <AlertDialogCancel disabled={excluindo}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(
                            buttonVariants({ variant: "destructive" }),
                        )}
                        disabled={excluindo}
                        onClick={(evento) => {
                            evento.preventDefault();
                            void excluir();
                        }}
                    >
                        {excluindo ? (
                            <SpinnerGapIcon
                                aria-hidden="true"
                                className="animate-spin"
                            />
                        ) : (
                            <TrashIcon aria-hidden="true" />
                        )}
                        {excluindo ? "Excluindo…" : "Excluir grupo"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
