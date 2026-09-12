"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

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

import type { FormGrupo } from "./grupo";
import { FormGrupoEntidade } from "./form-grupo";

interface Props {
    onCriar: (dados: FormGrupo) => Promise<void> | void;
}

/**
 * O cadastro de grupo, que sai do próprio botão que o promete: o gatilho cresce
 * até virar o formulário e encolhe de volta ao fechar. Ver `docs/animacoes.md`.
 *
 * Fica na linha do título, e não como uma vaga tracejada no fim da grade: é a
 * ação da tela, e é onde a tela de integrantes põe a dela — as duas listagens
 * da entidade se leem do mesmo jeito.
 */
export function BotaoCriarGrupo({ onCriar }: Props) {
    const [aberto, setAberto] = useState(false);

    /** Fecha só quando o salvamento deu certo — nome repetido mantém o que foi digitado. */
    const criar = async (dados: FormGrupo) => {
        await onCriar(dados);
        setAberto(false);
    };

    return (
        <ExpandableDialog
            id="criar-grupo"
            open={aberto}
            onOpenChange={setAberto}
        >
            {/* `buttonVariants` em vez de `<Button asChild>`: o gatilho já é o
                `button` do Radix sobre um `motion.button`, e embrulhar mais um
                daria botão dentro de botão.

                O `transition-colors` no fim não é enfeite: o botão vem com
                `transition-all`, e aí o navegador passa a interpolar, com os
                150ms dele, o `transform` que o Motion reescreve a cada quadro —
                o gatilho fica para trás do modal. */}
            <ExpandableDialogTrigger
                className={cn(buttonVariants(), "transition-colors")}
            >
                <SeloCompartilhado />
                {/* O mesmo texto do título, e não "Novo": o rótulo é
                    compartilhado, então o que muda de largura entre os dois
                    lados vira esticão de letra no meio do morph. */}
                <ExpandableDialogLabel>Criar grupo</ExpandableDialogLabel>
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-xl!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <SeloCompartilhado />
                        <ExpandableDialogTitle>
                            Criar grupo
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        Dê um nome ao grupo. Os integrantes entram depois, pela
                        lista ao lado.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody>
                    <FormGrupoEntidade
                        onSalvar={criar}
                        onCancelar={() => setAberto(false)}
                    />
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * O mais que viaja do botão para o cabeçalho do modal — do mesmo tamanho nos
 * dois lados, porque elemento compartilhado que muda de tamanho é escalado pelo
 * Motion, e escala em ícone deforma.
 *
 * Sem o disco do `ExpandableDialogIcon` padrão: o gatilho é um botão compacto,
 * e um selo de 36px dentro dele estouraria a altura.
 */
function SeloCompartilhado() {
    return (
        <ExpandableDialogIcon className="size-4 bg-transparent text-current">
            <PlusIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
