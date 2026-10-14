"use client";

import { useDeferredValue, useState } from "react";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";

import {
    buttonVariants,
    cn,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
    Input,
} from "@te-inscreve/components";

import { BotaoCriarModeloFicha } from "./botao-criar-modelo-ficha";
import { CartaoModeloFicha } from "./cartao-modelo-ficha";
import { filtrarModelosFicha, modelosFichaMock } from "./mock-modelos-ficha";

const ROTULO = "Selecionar ficha";

/**
 * O botão do estado vazio da ficha avaliativa, que se expande no seletor de
 * modelos. O seletor é a continuação do que o botão promete, então sai dele e
 * volta para ele. Ver `docs/animacoes.md`.
 *
 * O rótulo do botão é o título do modal, com o mesmo tamanho nos dois lados:
 * elemento compartilhado que muda de tamanho é escalado pelo Motion, e texto
 * escalado estica.
 */
export function BotaoSelecionarModeloFicha({
    categoriaId,
}: {
    categoriaId: number;
}) {
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState("");
    const modelos = filtrarModelosFicha(
        modelosFichaMock,
        useDeferredValue(busca),
    );

    return (
        <ExpandableDialog
            id={`selecionar-modelo-ficha-${categoriaId}`}
            open={aberto}
            onOpenChange={setAberto}
        >
            {/* `transition-colors` depois do `buttonVariants`: o
                `transition-all` dele faria o navegador interpolar o
                `transform` que o Motion reescreve a cada quadro. */}
            <ExpandableDialogTrigger
                className={cn(buttonVariants(), "transition-colors")}
            >
                <IconeCompartilhado />
                <ExpandableDialogLabel className="font-semibold">
                    {ROTULO}
                </ExpandableDialogLabel>
            </ExpandableDialogTrigger>

            {/* Altura fixa, e não só máxima: a caixa não pula de tamanho
                enquanto a busca encolhe a grade, e quem rola é só a grade —
                título e busca ficam no lugar. */}
            <ExpandableDialogContent className="h-[calc(100dvh-2rem)] max-w-4xl! overflow-hidden sm:h-[min(48rem,calc(100dvh-4rem))]">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <IconeCompartilhado />
                        <ExpandableDialogTitle className="text-sm font-semibold">
                            {ROTULO}
                        </ExpandableDialogTitle>
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

                    <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 pb-1">
                        {/* O atalho de criar fica fora do filtro: a busca sem
                            resultado é justamente quando ele mais serve. */}
                        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            <BotaoCriarModeloFicha />
                            {modelos.map((modelo) => (
                                <CartaoModeloFicha
                                    key={modelo.id}
                                    modelo={modelo}
                                />
                            ))}
                        </ul>
                        {modelos.length === 0 && (
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
function IconeCompartilhado() {
    return (
        <ExpandableDialogIcon className="size-4 bg-transparent text-current">
            <ClipboardTextIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
