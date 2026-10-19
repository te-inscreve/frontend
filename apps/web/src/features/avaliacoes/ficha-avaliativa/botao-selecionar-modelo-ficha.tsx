"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr";
import { ArrowsCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowsCounterClockwise";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
    buttonVariants,
    cn,
    DialogTitle,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogTrigger,
    ExpandableDialogTriggerText,
    Input,
} from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import { revalidarFichaDaCategoria } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import { BotaoCriarModeloFicha } from "./botao-criar-modelo-ficha";
import { CartaoModeloFicha } from "./cartao-modelo-ficha";
import { filtrarModelosFicha } from "./lib/filtrar-modelos-ficha";
import { mensagemDeErro } from "./lib/mensagem-de-erro";

/** Uma linha cheia da grade no maior breakpoint, ao lado do atalho de criar. */
const ESQUELETOS = 7;

/**
 * O botão do estado vazio da ficha avaliativa, que se expande no seletor de
 * modelos. O seletor é a continuação do que o botão promete, então sai dele e
 * volta para ele. Ver `docs/animacoes.md`.
 *
 * O rótulo do botão é o título do modal, com o mesmo tamanho nos dois lados:
 * elemento compartilhado que muda de tamanho é escalado pelo Motion, e texto
 * escalado estica.
 *
 * Os modelos só são buscados quando o seletor abre: a aba vazia é vista por
 * muita gente que nunca chega a abri-lo. Enquanto chegam, a grade mostra
 * pranchetas vazias do tamanho das de verdade.
 *
 * Clicar num modelo já o vincula à categoria. A aba da ficha é montada no
 * servidor, então o sucesso derruba o cache dela antes do `router.refresh()`;
 * o seletor fica aberto até lá, para o erro ter onde aparecer.
 *
 * Com `trocar`, é o mesmo seletor ao lado da ficha já vinculada: escolher
 * outro modelo refaz o mesmo `POST`, e o backend substitui o vínculo.
 */
export function BotaoSelecionarModeloFicha({
    eventoId,
    modalidadeId,
    categoriaId,
    trocar = false,
}: {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    trocar?: boolean;
}) {
    const router = useRouter();
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState("");
    const trpc = useTRPC();
    const consulta = useQuery({
        ...trpc.fichaAvaliativa.getAll.queryOptions({}),
        enabled: aberto,
    });
    const modelos = filtrarModelosFicha(
        consulta.data ?? [],
        useDeferredValue(busca),
    );

    const [atualizando, iniciarAtualizacao] = useTransition();
    const vincular = useMutation(
        trpc.categoria.vincularFichaAvaliativa.mutationOptions({
            // O modal só fecha no mesmo render que traz a aba atualizada. A
            // ficha nova muda o tamanho do cartão e empurra este botão: se a
            // página chegasse no meio do fechamento, o Motion recomeçaria a
            // animação do gatilho de onde ela estava, e o botão apareceria
            // pela metade com o modal ainda na tela.
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
    const ocupado = vincular.isPending || atualizando;

    return (
        <ExpandableDialog
            id={`selecionar-modelo-ficha-${categoriaId}`}
            open={aberto}
            onOpenChange={(proximo) => {
                // Fechar no meio do vínculo esconderia o resultado dele.
                if (ocupado) return;
                if (!proximo) vincular.reset();
                setAberto(proximo);
            }}
        >
            {/* `transition-colors` depois do `buttonVariants`: o
                `transition-all` dele faria o navegador interpolar o
                `transform` que o Motion reescreve a cada quadro. */}
            <ExpandableDialogTrigger
                className={cn(
                    buttonVariants({
                        variant: trocar ? "outline" : "default",
                    }),
                    "transition-colors",
                )}
            >
                <IconeCompartilhado trocar={trocar} />
                {/* Texto próprio do botão, diferente do título: não viaja,
                    então some no lugar em vez de esticar com a caixa. */}
                <ExpandableDialogTriggerText>
                    {trocar ? "Trocar" : "Selecionar"}
                </ExpandableDialogTriggerText>
            </ExpandableDialogTrigger>

            {/* Altura fixa, e não só máxima: a caixa não pula de tamanho
                enquanto a busca encolhe a grade, e quem rola é só a grade —
                título e busca ficam no lugar. */}
            <ExpandableDialogContent className="h-[calc(100dvh-2rem)] max-w-4xl! overflow-hidden sm:h-[min(48rem,calc(100dvh-4rem))]">
                <ExpandableDialogHeader>
                    <div className="text-primary flex items-center gap-2">
                        <IconeCompartilhado trocar={trocar} />
                        <DialogTitle className="font-semibold">
                            {trocar
                                ? "Trocar Ficha Avaliativa"
                                : "Selecionar Ficha Avaliativa"}
                        </DialogTitle>
                    </div>
                </ExpandableDialogHeader>

                <ExpandableDialogBody className="flex-1">
                    <div className="relative mx-auto w-full max-w-md">
                        <MagnifyingGlassIcon
                            aria-hidden="true"
                            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        />
                        <Input
                            type="search"
                            value={busca}
                            onChange={(evento) => setBusca(evento.target.value)}
                            placeholder="Buscar modelo"
                            aria-label="Buscar modelo de ficha"
                            autoComplete="off"
                            className="bg-card h-10 pl-9"
                        />
                    </div>

                    {vincular.isError && (
                        <p
                            role="alert"
                            className="bg-destructive/8 text-destructive mx-auto flex w-full max-w-md items-start gap-2 rounded-lg p-3 text-sm"
                        >
                            <WarningCircleIcon
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {mensagemDeErro(
                                vincular.error.data?.fieldErrors,
                                "Não foi possível vincular o modelo. Tente novamente.",
                            )}
                        </p>
                    )}

                    <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 pb-1">
                        {/* O atalho de criar fica fora do filtro: a busca sem
                            resultado é justamente quando ele mais serve. */}
                        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            <BotaoCriarModeloFicha />
                            {consulta.isPending &&
                                Array.from({ length: ESQUELETOS }, (_, i) => (
                                    <li key={i} aria-hidden="true">
                                        <Skeleton className="aspect-3/4 w-full rounded-lg" />
                                    </li>
                                ))}
                            {modelos.map((modelo) => (
                                <CartaoModeloFicha
                                    key={modelo.id}
                                    modelo={modelo}
                                    onSelecionar={() =>
                                        vincular.mutate({
                                            eventoId,
                                            modalidadeId,
                                            categoriaId,
                                            fichaAvaliativaId: modelo.id,
                                        })
                                    }
                                    selecionando={
                                        ocupado &&
                                        vincular.variables
                                            ?.fichaAvaliativaId === modelo.id
                                    }
                                    desabilitado={ocupado}
                                />
                            ))}
                        </ul>
                        {consulta.isError && (
                            <p
                                role="alert"
                                className="text-destructive flex items-center justify-center gap-2 py-12 text-sm"
                            >
                                <WarningCircleIcon
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Não foi possível carregar os modelos.{" "}
                                {consulta.error.message}
                            </p>
                        )}
                        {consulta.isSuccess && modelos.length === 0 && (
                            <p
                                aria-live="polite"
                                className="text-muted-foreground py-12 text-center text-sm"
                            >
                                Nenhum modelo encontrado.
                            </p>
                        )}
                    </div>
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/** A prancheta que viaja do botão para o cabeçalho, do mesmo tamanho. */
function IconeCompartilhado({ trocar }: { trocar: boolean }) {
    return (
        <ExpandableDialogIcon className="size-4 bg-transparent text-current">
            {trocar ? (
                <ArrowsCounterClockwiseIcon aria-hidden="true" weight="bold" />
            ) : (
                <ClipboardTextIcon aria-hidden="true" weight="bold" />
            )}
        </ExpandableDialogIcon>
    );
}
