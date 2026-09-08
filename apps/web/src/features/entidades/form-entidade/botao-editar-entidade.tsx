"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import type { MinhaEntidade } from "@te-inscreve/schemas";
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

import { FormEntidadeDialogo } from "./form-entidade-dialogo";

interface Props {
    entidade: MinhaEntidade;
}

/**
 * O botão do cabeçalho que abre a edição do cadastro expandindo-se no
 * formulário — o mesmo padrão de `BotaoEditarCategoria`, e pelo mesmo motivo:
 * o formulário é a continuação do que o botão promete, então sai dele e volta
 * para lá. Ver `docs/animacoes.md`.
 *
 * `id` fixo: há uma entidade por painel, então não há de quem derivá-lo nem
 * com quem colidir.
 */
export function BotaoEditarEntidade({ entidade }: Props) {
    const [aberto, setAberto] = useState(false);

    return (
        <ExpandableDialog
            id="editar-minha-entidade"
            open={aberto}
            onOpenChange={setAberto}
        >
            {/* `buttonVariants` em vez de `<Button asChild>`: o gatilho já é o
                `button` do Radix sobre um `motion.button`, e embrulhar mais um
                daria botão dentro de botão.

                O `transition-colors` no fim não é enfeite: o botão vem com
                `transition-all`, e aí o navegador passa a interpolar, com os
                150ms dele, o `transform` que o Motion reescreve a cada quadro
                — as duas animações disputam a mesma propriedade e o gatilho
                fica para trás do modal. */}
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
                            Editar entidade
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        É esse cadastro que identifica a entidade nas inscrições
                        e no contato da organização.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody>
                    <FormEntidadeDialogo
                        entidade={entidade}
                        onSalva={() => setAberto(false)}
                    />
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * A pena que viaja do botão para o cabeçalho do modal — do mesmo tamanho nos
 * dois lados, senão o Motion a escala e ela deforma no caminho.
 */
function PenaCompartilhada() {
    return (
        <ExpandableDialogIcon className="text-primary size-4 bg-transparent">
            <PencilSimpleIcon aria-hidden="true" />
        </ExpandableDialogIcon>
    );
}
