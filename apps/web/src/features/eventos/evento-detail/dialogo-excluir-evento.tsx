"use client";

import { useRouter } from "next/navigation";
import { CalendarXIcon } from "@phosphor-icons/react/dist/ssr/CalendarX";
import { TagIcon } from "@phosphor-icons/react/dist/ssr/Tag";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@te-inscreve/components";

import { revalidarEvento, revalidarListaEventos } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import { HoldToAct } from "~/shared/ui/hold-to-act";

interface Props {
    eventoId: number;
    open: boolean;
    onOpenChange: (aberto: boolean) => void;
}

/** O que some junto com o evento, listado para a exclusão não surpreender. */
const itensRemovidos = [
    { Icon: CalendarXIcon, label: "Modalidades e suas datas" },
    { Icon: TagIcon, label: "Categorias e valores de inscrição" },
    { Icon: UsersThreeIcon, label: "Inscrições já recebidas" },
];

/**
 * Confirmação da exclusão do evento.
 *
 * A ação destrutiva não é um clique: o organizador segura o botão até a barra
 * preencher. O gesto longo é a própria confirmação — por isso o diálogo não tem
 * um `AlertDialogAction` comum, e o `HoldToAct` ocupa o lugar dele.
 */
export function DialogoExcluirEvento({ eventoId, open, onOpenChange }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const excluirEvento = useMutation(
        trpc.evento.delete.mutationOptions({
            onSuccess: async () => {
                // A listagem para onde o organizador volta é montada no
                // servidor: sem derrubar o cache de lá, o evento excluído
                // continuaria na grade por até 30 segundos.
                await revalidarListaEventos();
                await revalidarEvento(eventoId);

                await queryClient.invalidateQueries(
                    trpc.evento.getAll.queryFilter(),
                );
                setTimeout(() => {
                    router.replace("/admin/eventos");
                    router.refresh();
                }, 2000);
            },
        }),
    );

    return (
        <AlertDialog
            open={open}
            onOpenChange={(aberto) => {
                // Fechar no meio da exclusão deixaria o organizador sem retorno
                // do que aconteceu.
                if (excluirEvento.isPending) return;
                // Fechar descarta o erro da tentativa anterior, para o diálogo
                // não reabrir com um aviso já resolvido.
                if (!aberto) excluirEvento.reset();
                onOpenChange(aberto);
            }}
        >
            <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <div className="bg-destructive-foreground border-destructive flex flex-col items-center gap-3 border-b px-6 pt-8 pb-6 text-center">
                    <span
                        aria-hidden="true"
                        className="bg-destructive/15 text-destructive ring-destructive/15 flex size-14 items-center justify-center rounded-full ring-8"
                    >
                        <TrashIcon weight="bold" className="size-7" />
                    </span>

                    <AlertDialogHeader className="gap-1 text-center sm:text-center">
                        <AlertDialogTitle>
                            Excluir este evento?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <div className="flex flex-col gap-5 px-6 py-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Também será removido
                        </p>
                        <ul className="flex flex-col gap-2.5">
                            {itensRemovidos.map(({ Icon, label }) => (
                                <li
                                    key={label}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="text-destructive size-4 shrink-0"
                                    />
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {excluirEvento.isError && (
                        <p
                            role="alert"
                            className="bg-destructive/8 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm"
                        >
                            <WarningIcon
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            Não foi possível excluir o evento. Tente novamente.
                        </p>
                    )}
                    <div className="flex items-start gap-2">
                        <AlertDialogCancel
                            disabled={excluirEvento.isPending}
                            className="w-fit shrink shadow-none"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <div className="flex w-full flex-col gap-2">
                            <HoldToAct
                                color="destructive"
                                text={{
                                    idle: "Excluir",
                                    pending: "Excluindo…",
                                    completed: "Excluído",
                                }}
                                // Deixar rejeitar é proposital: o `HoldToAct` volta
                                // para `idle` e o estado de erro da mutation vira o
                                // aviso acima.
                                onComplete={async () => {
                                    await new Promise((resolve) =>
                                        setTimeout(resolve, 1000),
                                    );
                                    await excluirEvento.mutateAsync({
                                        id: eventoId,
                                    });
                                }}
                            />

                            <p
                                role="status"
                                className="text-muted-foreground text-center text-xs"
                            >
                                {excluirEvento.isPending
                                    ? "Excluindo o evento…"
                                    : "Mantenha o botão pressionado."}
                            </p>
                        </div>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
