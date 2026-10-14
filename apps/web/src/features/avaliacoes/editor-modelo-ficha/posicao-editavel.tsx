"use client";

import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsSixVertical";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { get, useFormState } from "react-hook-form";

import { Badge, Button } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { DadosArraste } from "./lib/arraste";
import type { CampoExibido } from "./lib/campo-exibido";
import type {
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";
import type { Recipiente } from "./use-composicao";
import { ControleCampo } from "./controle-campo";
import { useEditor } from "./editor-contexto";
import { dadosDe } from "./lib/arraste";
import { exibirCampoExclusivo, exibirCampoGlobal } from "./lib/campo-exibido";
import { idRecipiente } from "./use-composicao";

interface Props {
    posicao: PosicaoForm;
    recipiente: Recipiente;
    /** Caminho da posição no formulário, para achar os erros dela. */
    caminho: string;
}

/**
 * Uma posição na ficha em edição: o campo desenhado como o jurado o vê, com a
 * alça para reordenar e o botão de tirar. A exclusiva abre o painel de
 * propriedades ao clique; a global só se move e sai.
 */
export function PosicaoEditavel({ posicao, recipiente, caminho }: Props) {
    const { camposGlobais, composicao, selecionado, selecionar } = useEditor();
    const { errors } = useFormState<ModeloFichaFormValues>();
    const { active, over } = useDndContext();

    const campo = campoDaPosicao(posicao, camposGlobais);
    const exclusiva = posicao.origem === "exclusivo";
    const aberta = exclusiva && selecionado === posicao.chave;
    const comErro = Boolean(get(errors, caminho));

    const dados: DadosArraste = {
        tipo: "posicao",
        recipiente: idRecipiente(recipiente),
        rotulo: campo?.nome ?? "Campo",
    };
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: posicao.chave, data: dados });

    // O campo do catálogo não abre vaga na lista: a linha marca onde ele entra.
    const recebendoGlobal =
        dadosDe(active?.data)?.tipo === "global" && over?.id === posicao.chave;

    if (!campo) return null;

    function abrir() {
        if (exclusiva) selecionar(posicao.chave);
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
            }}
            className={cn("relative", isDragging && "z-10 opacity-60")}
        >
            {recebendoGlobal && (
                <span
                    aria-hidden="true"
                    className="bg-primary absolute inset-x-0 -top-3 h-0.5 rounded-full"
                />
            )}
            <div
                onClick={(evento) => {
                    evento.stopPropagation();
                    abrir();
                }}
                className={cn(
                    "group/posicao bg-card relative flex gap-2 rounded-md border border-transparent py-3 pr-3 pl-1 transition-colors",
                    exclusiva && "hover:border-border cursor-pointer",
                    !exclusiva && "hover:border-border/60",
                    aberta && "border-primary ring-primary/20 ring-[3px]",
                    comErro && "border-destructive",
                )}
            >
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    {...attributes}
                    {...listeners}
                    aria-roledescription="posição arrastável"
                    aria-label={`Mover ${campo.nome}`}
                    onClick={(evento) => evento.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex w-6 shrink-0 cursor-grab touch-none items-start justify-center rounded-sm pt-0.5 outline-none focus-visible:ring-[3px]"
                >
                    <DotsSixVerticalIcon aria-hidden="true" weight="bold" />
                </button>

                <div className="min-w-0 flex-1">
                    <ControleCampo
                        campo={campo}
                        id={`editor-${posicao.chave}`}
                        desabilitado
                    />
                    {comErro && (
                        <p className="text-destructive mt-2 text-sm">
                            Revise as propriedades deste campo.
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 items-start gap-1">
                    {exclusiva ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${campo.nome}`}
                            aria-pressed={aberta}
                            onClick={(evento) => {
                                evento.stopPropagation();
                                abrir();
                            }}
                        >
                            <PencilSimpleIcon aria-hidden="true" />
                        </Button>
                    ) : (
                        <Badge variant="outline" className="mt-1.5">
                            <LockSimpleIcon aria-hidden="true" />
                            Global
                        </Badge>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${campo.nome}`}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-focus-within/posicao:opacity-100 group-hover/posicao:opacity-100"
                        onClick={(evento) => {
                            evento.stopPropagation();
                            if (aberta) selecionar(null);
                            composicao.removerPosicao(
                                recipiente,
                                posicao.chave,
                            );
                        }}
                    >
                        <TrashIcon aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function campoDaPosicao(
    posicao: PosicaoForm,
    camposGlobais: ReadonlyMap<number, Parameters<typeof exibirCampoGlobal>[0]>,
): CampoExibido | null {
    if (posicao.origem === "exclusivo") {
        return exibirCampoExclusivo(posicao.campo);
    }
    const global = camposGlobais.get(posicao.campoId);
    return global ? exibirCampoGlobal(global) : null;
}
