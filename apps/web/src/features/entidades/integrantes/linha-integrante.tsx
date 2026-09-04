"use client";

import { useState } from "react";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import {
    Badge,
    Checkbox,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
    Label,
} from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    formatarDataISO,
    idadeEm,
    matriculaVencida,
} from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";
import { DetalheIntegrante } from "./detalhe-integrante";

interface Props {
    integrante: Integrante;
    /** Fora do modo de seleção a linha abre o detalhe; dentro dele, marca. */
    modoSelecao: boolean;
    marcado: boolean;
    onAlternar: (id: number) => void;
    gruposDaSessao: string[];
}

/**
 * Uma pessoa na listagem.
 *
 * A linha tem dois papéis, e eles não convivem: fora do modo de seleção ela é
 * o botão que abre o detalhe; dentro dele, é a área de marcar. Por isso são
 * duas renderizações e não uma com um `if` no clique — a de seleção tem caixa
 * e rótulo, e caixa de seleção dentro de botão não é HTML válido.
 */
export function LinhaIntegrante({
    integrante,
    modoSelecao,
    marcado,
    onAlternar,
    gruposDaSessao,
}: Props) {
    const [aberto, setAberto] = useState(false);

    if (modoSelecao) {
        return (
            <li
                className={cn(
                    "flex flex-wrap items-center gap-3 p-3 transition-colors",
                    marcado && "bg-primary/5",
                )}
            >
                <Checkbox
                    id={`integrante-${integrante.id}`}
                    checked={marcado}
                    onCheckedChange={() => onAlternar(integrante.id)}
                    aria-label={`Selecionar ${integrante.nome}`}
                />

                <AvatarUsuario nome={integrante.nome} size={36} alt="" />

                <div className="min-w-0 flex-1">
                    <Label
                        htmlFor={`integrante-${integrante.id}`}
                        className="block truncate text-sm font-semibold"
                    >
                        {integrante.nome}
                    </Label>
                    <Resumo integrante={integrante} />
                </div>

                <AvisoMatricula integrante={integrante} />
            </li>
        );
    }

    return (
        <li>
            <ExpandableDialog
                id={`integrante-${integrante.id}`}
                open={aberto}
                onOpenChange={setAberto}
            >
                <ExpandableDialogTrigger
                    // A linha não tem cantos próprios: dentro da lista ela é
                    // uma faixa de ponta a ponta, e o arredondado é uma das
                    // coisas que o morph traz — daí o raio zero aqui contra o
                    // do modal.
                    style={{ borderRadius: 0 }}
                    className="hover:bg-muted/50 focus-visible:ring-ring/50 flex w-full flex-wrap items-center gap-3 p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                    <ExpandableDialogIcon className="size-9 bg-transparent">
                        <AvatarUsuario
                            nome={integrante.nome}
                            size={36}
                            alt=""
                        />
                    </ExpandableDialogIcon>

                    <span className="min-w-0 flex-1">
                        <ExpandableDialogLabel className="block truncate text-sm font-semibold">
                            {integrante.nome}
                        </ExpandableDialogLabel>
                        <Resumo integrante={integrante} />
                    </span>

                    <AvisoMatricula integrante={integrante} />
                </ExpandableDialogTrigger>

                <ExpandableDialogContent className="max-w-xl!">
                    {/* O cabeçalho é a linha, do mesmo tamanho: avatar 36,
                        nome em `text-sm`, mesmo `flex-1`. Elemento
                        compartilhado que muda de tamanho é escalado pelo
                        Motion, e escala em texto é exatamente o esticamento —
                        quem cresce no morph é a caixa, não as peças dela. A
                        folga à direita é do botão de fechar. */}
                    <ExpandableDialogHeader>
                        <div className="flex items-center gap-3 pr-7">
                            <ExpandableDialogIcon className="size-9 bg-transparent">
                                <AvatarUsuario
                                    nome={integrante.nome}
                                    size={36}
                                    alt=""
                                />
                            </ExpandableDialogIcon>

                            <span className="min-w-0 flex-1">
                                <ExpandableDialogTitle className="block truncate text-sm font-semibold">
                                    {integrante.nome}
                                </ExpandableDialogTitle>
                                <Resumo integrante={integrante} />
                            </span>

                            <AvisoMatricula integrante={integrante} />
                        </div>
                    </ExpandableDialogHeader>

                    <ExpandableDialogBody>
                        <DetalheIntegrante
                            integrante={integrante}
                            gruposDaSessao={gruposDaSessao}
                        />
                    </ExpandableDialogBody>
                </ExpandableDialogContent>
            </ExpandableDialog>
        </li>
    );
}

/**
 * Matrícula e idade — o que decide se a pessoa pode ser inscrita.
 *
 * Tudo em `span`: fora do modo de seleção a linha é um `button`, e `button` só
 * aceita conteúdo de frase — `div` e `p` ali dentro seriam HTML inválido.
 */
function Resumo({ integrante }: { integrante: Integrante }) {
    return (
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="flex items-center gap-1">
                <IdentificationCardIcon aria-hidden="true" />
                {integrante.matriculaCtg}
            </span>
            {" · "}
            <span className="flex items-center gap-1">
                {idadeEm(integrante.dataNascimento)} anos
            </span>
        </span>
    );
}

/** A validade só aparece quando é problema — vencida, ela trava a inscrição. */
function AvisoMatricula({ integrante }: { integrante: Integrante }) {
    if (!matriculaVencida(integrante)) return null;

    return (
        <span className="flex shrink-0 items-center gap-2">
            <Badge
                variant="outline"
                className="border-warning/40 bg-warning/10 gap-1"
            >
                <WarningIcon
                    aria-hidden="true"
                    weight="fill"
                    className="text-warning"
                />
                Matrícula vencida em{" "}
                {formatarDataISO(integrante.validadeMatricula)}
            </Badge>
        </span>
    );
}
