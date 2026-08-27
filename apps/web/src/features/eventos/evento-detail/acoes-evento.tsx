"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { MegaphoneIcon } from "@phosphor-icons/react/dist/ssr/Megaphone";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Button,
    buttonVariants,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@te-inscreve/components";

import { useTRPC } from "~/shared/api/trpc/client";

interface Props {
    eventoId: number;
}

/**
 * Menu de ações do evento, no cabeçalho da página de detalhe.
 *
 * A exclusão é confirmada em um `AlertDialog` controlado fora do menu: o item
 * segura o `onSelect` para o Radix não fechar tudo antes do diálogo montar.
 */
export function AcoesEvento({ eventoId }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
    const [aviso, setAviso] = useState<string | null>(null);

    const excluirEvento = useMutation(
        trpc.evento.delete.mutationOptions({
            onSuccess: async () => {
                setConfirmandoExclusao(false);
                await queryClient.invalidateQueries(
                    trpc.evento.getAll.queryFilter(),
                );
                // `replace`: o evento não existe mais, então o voltar do
                // navegador não deve trazer a página dele de volta.
                router.replace("/admin/eventos");
                router.refresh();
            },
            onError: () => {
                setConfirmandoExclusao(false);
                setAviso("Não foi possível excluir o evento. Tente novamente.");
            },
        }),
    );

    return (
        <div className="flex flex-col items-end gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        Ações
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

                    <DropdownMenuItem
                        onSelect={() =>
                            // TODO: ligar ao endpoint de publicação quando ele
                            // existir no backend.
                            setAviso(
                                "A publicação do evento ainda não está disponível.",
                            )
                        }
                    >
                        <MegaphoneIcon aria-hidden="true" />
                        Publicar evento
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={(evento) => {
                            evento.preventDefault();
                            setAviso(null);
                            setConfirmandoExclusao(true);
                        }}
                    >
                        <TrashIcon aria-hidden="true" />
                        Excluir evento
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {aviso && (
                <p role="status" className="text-muted-foreground text-xs">
                    {aviso}
                </p>
            )}

            <AlertDialog
                open={confirmandoExclusao}
                onOpenChange={setConfirmandoExclusao}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir este evento?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            As modalidades, categorias e inscrições do evento
                            saem junto. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={excluirEvento.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({
                                variant: "destructive",
                            })}
                            disabled={excluirEvento.isPending}
                            onClick={(clique) => {
                                // Sem isso o Radix fecha o diálogo no clique, e
                                // o organizador fica sem retorno da exclusão.
                                clique.preventDefault();
                                excluirEvento.mutate({ id: eventoId });
                            }}
                        >
                            {excluirEvento.isPending
                                ? "Excluindo…"
                                : "Excluir evento"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
