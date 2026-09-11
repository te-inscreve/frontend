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

import type { FormGrupo } from "./grupo";
import { FormGrupoEntidade } from "./form-grupo";

interface Props {
    onCriar: (dados: FormGrupo) => Promise<void> | void;
    /**
     * Sem nenhum grupo o atalho ocupa a grade inteira e explica o vazio; ao lado
     * de cartões ele é só a vaga seguinte da fila.
     */
    sozinho: boolean;
}

/**
 * Atalho para criar grupo, no fim da grade.
 *
 * Tem a borda tracejada de uma vaga vazia e se expande no formulário em vez de
 * levar a outra página: a grade e a coluna de integrantes continuam onde
 * estavam, e o grupo novo já nasce aberto para receber gente. Ver
 * `docs/animacoes.md`.
 */
export function BotaoCriarGrupo({ onCriar, sozinho }: Props) {
    const [aberto, setAberto] = useState(false);

    /** Fecha só quando o salvamento deu certo — nome repetido mantém o que foi digitado. */
    const criar = async (dados: FormGrupo) => {
        await onCriar(dados);
        setAberto(false);
    };

    return (
        <li className={cn(sozinho && "sm:col-span-2")}>
            <ExpandableDialog
                id="criar-grupo"
                open={aberto}
                onOpenChange={setAberto}
            >
                <ExpandableDialogTrigger
                    className={cn(
                        "text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring/50 flex w-full flex-col items-center justify-center gap-2 border border-dashed p-4 text-center transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                        sozinho ? "min-h-44" : "h-full min-h-32",
                    )}
                >
                    <ExpandableDialogIcon>
                        <PlusIcon aria-hidden="true" weight="bold" />
                    </ExpandableDialogIcon>
                    <ExpandableDialogLabel>Criar grupo</ExpandableDialogLabel>
                    {sozinho && (
                        <span className="max-w-sm text-xs">
                            A entidade ainda não tem grupos. Crie o primeiro
                            para juntar integrantes e inscrevê-los de uma vez.
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
                                Criar grupo
                            </ExpandableDialogTitle>
                        </div>
                        <ExpandableDialogDescription>
                            Dê um nome ao grupo. Os integrantes entram depois,
                            pela lista ao lado.
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
        </li>
    );
}
