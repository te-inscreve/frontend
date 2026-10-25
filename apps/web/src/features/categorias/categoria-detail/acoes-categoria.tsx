"use client";

import type { Icon } from "@phosphor-icons/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/ssr/FlagCheckered";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { LockSimpleOpenIcon } from "@phosphor-icons/react/dist/ssr/LockSimpleOpen";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr/XCircle";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AcaoSituacaoCategoria, Categoria } from "@te-inscreve/schemas";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@te-inscreve/components";
import { acoesPorSituacaoCategoria } from "@te-inscreve/schemas";

import { revalidarCategoria } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoria: Categoria;
}

interface DescricaoAcao {
    rotulo: string;
    Icone: Icon;
    /**
     * Cancelar, encerrar e liberar a avaliação não têm volta: essas passam
     * por confirmação. Abrir e fechar se desfazem com a ação oposta.
     */
    confirmacao?: { titulo: string; descricao: string; botao: string };
    /** Pinta o item e o botão de confirmação como destrutivos. */
    destrutiva?: boolean;
}

const ACOES: Record<AcaoSituacaoCategoria, DescricaoAcao> = {
    abrir: { rotulo: "Abrir inscrições", Icone: LockSimpleOpenIcon },
    fechar: { rotulo: "Fechar inscrições", Icone: LockSimpleIcon },
    liberar_avaliacao: {
        rotulo: "Liberar avaliação",
        Icone: ClipboardTextIcon,
        confirmacao: {
            titulo: "Liberar a avaliação desta categoria?",
            descricao:
                "Os avaliadores passam a avaliar as inscrições com a ficha vinculada. As inscrições não poderão ser reabertas.",
            botao: "Liberar avaliação",
        },
    },
    encerrar: {
        rotulo: "Encerrar categoria",
        Icone: FlagCheckeredIcon,
        confirmacao: {
            titulo: "Encerrar esta categoria?",
            descricao:
                "A categoria deixa de receber inscrições e não poderá ser reaberta.",
            botao: "Encerrar",
        },
        destrutiva: true,
    },
    cancelar: {
        rotulo: "Cancelar categoria",
        Icone: XCircleIcon,
        confirmacao: {
            titulo: "Cancelar esta categoria?",
            descricao: "A categoria não acontecerá e não poderá ser reaberta.",
            botao: "Cancelar categoria",
        },
        destrutiva: true,
    },
};

/**
 * Menu de três pontos ao lado do Editar, com as mudanças de situação da
 * categoria.
 *
 * Só aparecem as ações que o backend aceita para a situação atual — a tabela
 * de transições vem de `@te-inscreve/schemas`. As finais passam por um
 * `AlertDialog` controlado fora do menu; o item segura o `onSelect` para o
 * Radix não fechar tudo antes de o diálogo montar.
 */
export function AcoesCategoria({ eventoId, modalidadeId, categoria }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const [confirmando, setConfirmando] =
        useState<AcaoSituacaoCategoria | null>(null);

    const alterarSituacao = useMutation(
        trpc.categoria.alterarSituacao.mutationOptions({
            onSuccess: async () => {
                // O cabeçalho e a fila da modalidade são montados no servidor:
                // sem derrubar o cache de lá, o `router.refresh()` repintaria
                // a situação anterior.
                await revalidarCategoria(eventoId, modalidadeId, categoria.id);
                await queryClient.invalidateQueries(
                    trpc.categoria.getById.queryFilter({
                        eventoId,
                        modalidadeId,
                        categoriaId: categoria.id,
                    }),
                );
                await queryClient.invalidateQueries(
                    trpc.modalidade.getById.queryFilter({
                        eventoId,
                        modalidadeId,
                    }),
                );
                setConfirmando(null);
                router.refresh();
            },
        }),
    );

    function executar(action: AcaoSituacaoCategoria) {
        alterarSituacao.mutate({
            eventoId,
            modalidadeId,
            categoriaId: categoria.id,
            action,
        });
    }

    const disponiveis = acoesPorSituacaoCategoria[categoria.situacao.value];
    const erro = alterarSituacao.error
        ? mensagemDeErro(alterarSituacao.error.data?.fieldErrors)
        : null;
    const acaoConfirmando = confirmando ? ACOES[confirmando] : null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Mais ações da categoria"
                        disabled={alterarSituacao.isPending}
                    >
                        {alterarSituacao.isPending ? (
                            <CircleNotchIcon
                                aria-hidden="true"
                                className="animate-spin"
                            />
                        ) : (
                            <DotsThreeVerticalIcon
                                aria-hidden="true"
                                weight="bold"
                            />
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                        {categoria.situacao.label}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {disponiveis.length === 0 && (
                        <DropdownMenuItem disabled>
                            Situação final, sem ações disponíveis
                        </DropdownMenuItem>
                    )}

                    {disponiveis.map((action) => {
                        const { rotulo, Icone, confirmacao, destrutiva } =
                            ACOES[action];
                        return (
                            <DropdownMenuItem
                                key={action}
                                variant={destrutiva ? "destructive" : "default"}
                                onSelect={(evento) => {
                                    if (!confirmacao) {
                                        executar(action);
                                        return;
                                    }
                                    evento.preventDefault();
                                    alterarSituacao.reset();
                                    setConfirmando(action);
                                }}
                            >
                                <Icone aria-hidden="true" />
                                {rotulo}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Erro de abrir ou fechar, que não passam por diálogo: aparece
                logo abaixo do cabeçalho, inteiro na linha. */}
            {erro && !confirmando && (
                <p
                    role="alert"
                    className="text-destructive flex basis-full items-center justify-end gap-2 text-sm"
                >
                    <WarningIcon aria-hidden="true" className="size-4" />
                    {erro}
                </p>
            )}

            <AlertDialog
                open={confirmando !== null}
                onOpenChange={(aberto) => {
                    if (alterarSituacao.isPending) return;
                    if (!aberto) {
                        alterarSituacao.reset();
                        setConfirmando(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {acaoConfirmando?.confirmacao?.titulo}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {acaoConfirmando?.confirmacao?.descricao}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {erro && (
                        <p
                            role="alert"
                            className="bg-destructive/8 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm"
                        >
                            <WarningIcon
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {erro}
                        </p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={alterarSituacao.isPending}>
                            Voltar
                        </AlertDialogCancel>
                        {/* Botão comum, e não `AlertDialogAction`: este fecharia
                            o diálogo no clique, antes da resposta — e o erro
                            não teria onde aparecer. */}
                        <Button
                            variant={
                                acaoConfirmando?.destrutiva
                                    ? "destructive"
                                    : "default"
                            }
                            disabled={alterarSituacao.isPending}
                            onClick={() => confirmando && executar(confirmando)}
                        >
                            {alterarSituacao.isPending && (
                                <CircleNotchIcon
                                    aria-hidden="true"
                                    className="animate-spin"
                                />
                            )}
                            {acaoConfirmando?.confirmacao?.botao}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

/**
 * A transição proibida — e a liberação sem ficha avaliativa — chega em `detail`, e a ação inválida em `action`. Sem
 * nenhum dos dois, vale a mensagem genérica.
 */
function mensagemDeErro(
    fieldErrors: Record<string, string[]> | null | undefined,
): string {
    const mensagens = [
        ...(fieldErrors?.detail ?? []),
        ...(fieldErrors?.action ?? []),
    ];
    return mensagens.length > 0
        ? mensagens.join(" ")
        : "Não foi possível mudar a situação da categoria. Tente novamente.";
}
