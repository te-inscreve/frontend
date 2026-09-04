"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import type { Categoria } from "@te-inscreve/schemas";
import {
    buttonVariants,
    cn,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
} from "@te-inscreve/components";

import { FormCategoriaDialogo } from "~/features/categorias/form-categoria/form-categoria-dialogo";

interface Props {
    eventoId: number;
    /** A modalidade não está na rota, mas o endpoint da categoria é aninhado nela. */
    modalidadeId: number;
    categoria: Categoria;
}

/**
 * O botão que abre a edição da categoria expandindo-se no formulário.
 *
 * Editar era uma página inteira para quatro campos: saía-se do detalhe e
 * voltava-se a ele. Como o formulário é a continuação do que o botão promete,
 * ele sai do próprio botão e volta para lá. Ver `docs/animacoes.md`.
 */
export function BotaoEditarCategoria({
    eventoId,
    modalidadeId,
    categoria,
}: Props) {
    const [aberto, setAberto] = useState(false);

    return (
        <ExpandableDialog
            id={`editar-categoria-${categoria.id}`}
            open={aberto}
            onOpenChange={setAberto}
        >
            {/* `buttonVariants` em vez de `<Button asChild>`: o gatilho já é o
                `button` do Radix sobre um `motion.button`, e embrulhar mais um
                daria botão dentro de botão. Aqui só o visual é reaproveitado.

                O `transition-colors` no fim não é enfeite: o botão vem com
                `transition-all`, e aí o próprio navegador passa a interpolar,
                com os 150ms dele, o `transform` que o Motion reescreve a cada
                quadro. Os dois disputam a mesma propriedade e o gatilho fica
                para trás do modal, como se fossem duas animações soltas. */}
            <ExpandableDialogTrigger
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "transition-colors",
                )}
            >
                <PenaCompartilhada />
                <ExpandableDialogLabel>Editar</ExpandableDialogLabel>
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-xl!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <PenaCompartilhada />
                        <ExpandableDialogTitle>
                            Editar categoria
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        As alterações valem para as inscrições que ainda vão
                        acontecer.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody>
                    <FormCategoriaDialogo
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        categoria={categoria}
                        onSalva={() => setAberto(false)}
                    />
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * A pena que viaja do botão para o cabeçalho do modal — do mesmo tamanho nos
 * dois lados.
 *
 * Sem o disco do `ExpandableDialogIcon` padrão: aqui o gatilho é um botão
 * compacto, e um selo de 36px dentro dele estouraria a altura. Crescer no
 * caminho também não serve — elemento compartilhado que muda de tamanho é
 * escalado pelo Motion, e escala em ícone deforma como deforma em texto.
 */
function PenaCompartilhada() {
    return (
        <ExpandableDialogIcon className="text-primary size-4 bg-transparent">
            <PencilSimpleIcon aria-hidden="true" />
        </ExpandableDialogIcon>
    );
}
