"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import {
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
    modalidadeId: number;
    /**
     * Sem nenhuma categoria o atalho ocupa a largura de um cartão e explica o
     * vazio; ao lado de cartões ele encolhe e vira só o "mais" da fila.
     */
    sozinho: boolean;
}

/**
 * Atalho para criar categoria, no fim da fila de cartões.
 *
 * Fica do tamanho de um cartão e com a borda tracejada de uma vaga vazia, mas
 * mantém o feedback de controle — cursor, realce no hover e anel de foco — para
 * não ser lido como mais um cartão da lista.
 *
 * O cadastro não é uma página: o próprio atalho se expande no formulário e
 * encolhe de volta ao fechar, então a modalidade aberta e a fila continuam
 * onde estavam. Ver `docs/animacoes.md`.
 */
export function BotaoCriarCategoria({
    eventoId,
    modalidadeId,
    sozinho,
}: Props) {
    const [aberto, setAberto] = useState(false);

    return (
        <ExpandableDialog
            // Há uma fila de categorias por modalidade, e todas podem estar
            // montadas: o id precisa dizer de qual delas o modal saiu.
            id={`criar-categoria-${modalidadeId}`}
            open={aberto}
            onOpenChange={setAberto}
        >
            <ExpandableDialogTrigger
                className={cn(
                    "bg-card text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring/50 focus-visible:outline-ring flex h-full shrink-0 flex-col items-center justify-center gap-2 border border-dashed p-4 text-center transition-colors focus-visible:ring-[3px] focus-visible:outline-1",
                    sozinho ? "w-100" : "w-44",
                )}
            >
                <ExpandableDialogIcon>
                    <PlusIcon aria-hidden="true" weight="bold" />
                </ExpandableDialogIcon>
                <ExpandableDialogLabel>Criar categoria</ExpandableDialogLabel>
                {sozinho && (
                    <span className="text-xs">
                        Esta modalidade ainda não tem categorias. Crie a
                        primeira para abrir inscrições.
                    </span>
                )}
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-xl!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-3">
                        <ExpandableDialogIcon>
                            <PlusIcon aria-hidden="true" weight="bold" />
                        </ExpandableDialogIcon>
                        <ExpandableDialogTitle>
                            Criar categoria
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        A categoria entra na modalidade e passa a receber
                        inscrições.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody>
                    <FormCategoriaDialogo
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        onSalva={() => setAberto(false)}
                    />
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}
