"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { useMutation } from "@tanstack/react-query";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    Button,
} from "@te-inscreve/components";

import { revalidarFichaDaCategoria } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import { mensagemDeErro } from "./lib/mensagem-de-erro";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    nomeModelo: string;
}

/**
 * Desvincula o modelo de ficha da categoria, ao lado do "Trocar".
 *
 * O modelo continua existindo, mas a categoria volta a ficar sem critério de
 * avaliação: passa por confirmação. O diálogo fica aberto até a aba já ter
 * voltado ao estado vazio, para a recusa do backend — depois que uma avaliação
 * foi enviada — ter onde aparecer.
 */
export function BotaoRemoverFichaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
    nomeModelo,
}: Props) {
    const router = useRouter();
    const trpc = useTRPC();
    const [aberto, setAberto] = useState(false);
    const [atualizando, iniciarAtualizacao] = useTransition();

    const remover = useMutation(
        trpc.categoria.removerFichaAvaliativa.mutationOptions({
            onSuccess: () =>
                iniciarAtualizacao(async () => {
                    await revalidarFichaDaCategoria(categoriaId);
                    iniciarAtualizacao(() => {
                        router.refresh();
                        setAberto(false);
                    });
                }),
        }),
    );
    const ocupado = remover.isPending || atualizando;

    return (
        <AlertDialog
            open={aberto}
            onOpenChange={(proximo) => {
                if (ocupado) return;
                if (!proximo) remover.reset();
                setAberto(proximo);
            }}
        >
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/8"
                >
                    <TrashIcon aria-hidden="true" weight="bold" />
                    Remover
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Remover a ficha avaliativa?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        A categoria deixa de usar “{nomeModelo}” e fica sem
                        ficha até um novo modelo ser escolhido. O modelo
                        continua disponível.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {remover.isError && (
                    <p
                        role="alert"
                        className="bg-destructive/8 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm"
                    >
                        <WarningIcon
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        {mensagemDeErro(
                            remover.error.data?.fieldErrors,
                            "Não foi possível remover a ficha. Tente novamente.",
                        )}
                    </p>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={ocupado}>
                        Voltar
                    </AlertDialogCancel>
                    {/* Botão comum, e não `AlertDialogAction`: este fecharia
                        o diálogo no clique, antes da resposta — e o erro não
                        teria onde aparecer. */}
                    <Button
                        variant="destructive"
                        disabled={ocupado}
                        onClick={() =>
                            remover.mutate({
                                eventoId,
                                modalidadeId,
                                categoriaId,
                            })
                        }
                    >
                        {ocupado && (
                            <CircleNotchIcon
                                aria-hidden="true"
                                className="animate-spin"
                            />
                        )}
                        Remover ficha
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
