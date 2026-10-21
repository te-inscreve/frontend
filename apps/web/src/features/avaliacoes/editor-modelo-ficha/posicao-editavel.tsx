"use client";

import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { get, useFormState } from "react-hook-form";

import { Button } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { DadosArraste } from "./lib/arraste";
import type { CampoExibido } from "./lib/campo-exibido";
import type {
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";
import type { Recipiente } from "./use-composicao";
import { CartaoCampo } from "./cartao-campo";
import { useEditor } from "./editor-contexto";
import { dadosDe } from "./lib/arraste";
import {
    exibirCampoExclusivo,
    exibirCampoGlobal,
    ROTULO_TIPO,
} from "./lib/campo-exibido";
import { idRecipiente } from "./use-composicao";
import { useLadoDaSoltura } from "./use-lado-da-soltura";

interface Props {
    posicao: PosicaoForm;
    recipiente: Recipiente;
    /** Caminho da posição no formulário, para achar os erros dela. */
    caminho: string;
}

/**
 * Uma posição na ficha em edição, no mesmo cartão do catálogo. O cartão
 * inteiro é a alça de arraste; a exclusiva abre o painel de propriedades ao
 * clique — a distância mínima do sensor separa clique de arraste.
 *
 * As ações vivem na doca do cartão: editar no lugar do lápis, sempre à
 * vista; remover desliza para fora dela com o ponteiro ou o foco. Os botões
 * param o `keydown` e o `pointerdown`: o cartão escuta os dois para
 * arrastar, e Enter em "Remover" começaria um arraste pelo teclado.
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
        transform,
        transition,
        isDragging,
    } = useSortable({ id: posicao.chave, data: dados });

    // O campo do catálogo e o que vem de fora do trecho — um agrupamento,
    // um campo geral de outro trecho — não abrem vaga na grade: a linha marca
    // onde entram. O do catálogo entra sempre antes.
    const recebendoGlobal =
        dadosDe(active?.data)?.tipo === "global" && over?.id === posicao.chave;
    const lado =
        useLadoDaSoltura(posicao.chave) ?? (recebendoGlobal ? "antes" : null);

    if (!campo) return null;

    function abrir() {
        if (exclusiva) selecionar(posicao.chave);
    }

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            aria-roledescription="posição arrastável"
            aria-label={`${campo.nome}, ${ROTULO_TIPO[campo.tipo]}${exclusiva ? "" : ", global"}`}
            onClick={(evento) => {
                evento.stopPropagation();
                abrir();
            }}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
            }}
            className={cn(
                "group/posicao focus-visible:ring-ring/50 relative h-full cursor-grab touch-none rounded-md outline-none focus-visible:ring-[3px]",
                isDragging && "z-10 opacity-60",
            )}
        >
            {lado && (
                <span
                    aria-hidden="true"
                    className={cn(
                        "bg-primary absolute inset-y-0 w-0.5 rounded-full",
                        lado === "antes" ? "-left-2" : "-right-2",
                    )}
                />
            )}
            <CartaoCampo
                campo={campo}
                global={!exclusiva}
                className={cn(
                    aberta && "border-primary ring-primary/20 ring-[3px]",
                    comErro && "border-destructive",
                )}
                icone={
                    exclusiva ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Editar ${campo.nome}`}
                            aria-pressed={aberta}
                            onKeyDown={(evento) => evento.stopPropagation()}
                            onPointerDown={(evento) => evento.stopPropagation()}
                            onClick={(evento) => {
                                evento.stopPropagation();
                                abrir();
                            }}
                        >
                            <PencilSimpleIcon aria-hidden="true" />
                        </Button>
                    ) : undefined
                }
                acoes={
                    <Button
                        type="button"
                        variant="ghost-destructive"
                        size="icon-xs"
                        aria-label={`Remover ${campo.nome}`}
                        onKeyDown={(evento) => evento.stopPropagation()}
                        onPointerDown={(evento) => evento.stopPropagation()}
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
                }
            >
                {comErro && (
                    <p className="text-destructive text-[11px] leading-tight">
                        Revise as propriedades.
                    </p>
                )}
            </CartaoCampo>
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
