"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { useMutation } from "@tanstack/react-query";

import {
    buttonVariants,
    cn,
    DialogTitle,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogClose,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogTrigger,
    ExpandableDialogTriggerText,
} from "@te-inscreve/components";

import { revalidarFichaDaCategoria } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import { HoldToAct } from "~/shared/ui/hold-to-act";
import { mensagemDeErro } from "./lib/mensagem-de-erro";

/** Tempo para o "Removida" do botão ser lido antes de o modal fechar. */
const EXIBIR_CONCLUSAO = 800;

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
 * avaliação: a confirmação é o gesto de segurar o botão até a barra preencher,
 * como na exclusão de evento.
 *
 * Expande a partir do próprio botão, como o "Trocar" ao lado, em vez do
 * `AlertDialog` que `docs/animacoes.md` indica para confirmação destrutiva:
 * foi escolha de produto, para os dois botões da ficha se comportarem igual.
 *
 * O modal fica aberto até a aba já ter voltado ao estado vazio, para a recusa
 * do backend — depois que uma avaliação foi enviada — ter onde aparecer. Ele
 * fecha no mesmo render que traz a aba atualizada: ver a armadilha 6 de
 * `docs/animacoes.md`.
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
    const [removida, setRemovida] = useState(false);
    const [atualizando, iniciarAtualizacao] = useTransition();

    const remover = useMutation(
        trpc.categoria.removerFichaAvaliativa.mutationOptions(),
    );
    const ocupado = remover.isPending || removida || atualizando;

    // Deixar rejeitar é proposital: o `HoldToAct` volta para `idle` e o estado
    // de erro da mutation vira o aviso acima dele.
    async function confirmar() {
        await remover.mutateAsync({ eventoId, modalidadeId, categoriaId });
        await revalidarFichaDaCategoria(categoriaId);
        setRemovida(true);
        setTimeout(
            () =>
                iniciarAtualizacao(() => {
                    router.refresh();
                    setAberto(false);
                }),
            EXIBIR_CONCLUSAO,
        );
    }

    return (
        <ExpandableDialog
            id={`remover-ficha-categoria-${categoriaId}`}
            open={aberto}
            onOpenChange={(proximo) => {
                // Fechar no meio da remoção esconderia o resultado dele.
                if (ocupado) return;
                if (!proximo) remover.reset();
                setAberto(proximo);
            }}
        >
            {/* `transition-colors` depois do `buttonVariants`: o
                `transition-all` dele faria o navegador interpolar o
                `transform` que o Motion reescreve a cada quadro. */}
            <ExpandableDialogTrigger
                className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "text-destructive hover:text-destructive hover:bg-destructive/8 transition-colors",
                )}
            >
                <IconeCompartilhado />
                <ExpandableDialogTriggerText>
                    Remover
                </ExpandableDialogTriggerText>
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-md">
                <ExpandableDialogHeader>
                    <div className="text-destructive flex items-center gap-2">
                        <IconeCompartilhado />
                        <DialogTitle className="font-semibold">
                            Remover Vínculo com Ficha Avaliativa
                        </DialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        A categoria deixa de usar “{nomeModelo}” e fica sem
                        ficha até um novo modelo ser escolhido. O modelo
                        continua disponível.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody>
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

                    <div className="flex items-start gap-2">
                        <ExpandableDialogClose
                            disabled={ocupado}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "w-fit shrink shadow-none",
                            )}
                        >
                            Voltar
                        </ExpandableDialogClose>
                        <div className="flex w-full flex-col gap-2">
                            <HoldToAct
                                color="destructive"
                                text={{
                                    idle: "Remover vínculo",
                                    pending: "Removendo…",
                                    completed: "Removida",
                                }}
                                onComplete={confirmar}
                            />
                            <p
                                role="status"
                                className="text-muted-foreground text-center text-xs"
                            >
                                {remover.isPending
                                    ? "Removendo vínculo…"
                                    : "Mantenha o botão pressionado."}
                            </p>
                        </div>
                    </div>
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/** A lixeira que viaja do botão para o cabeçalho, do mesmo tamanho. */
function IconeCompartilhado() {
    return (
        <ExpandableDialogIcon className="size-4 bg-transparent text-current">
            <TrashIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
