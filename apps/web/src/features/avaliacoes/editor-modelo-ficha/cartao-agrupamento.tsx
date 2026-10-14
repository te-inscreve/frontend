"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsSixVertical";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { Controller, useFormContext, useFormState } from "react-hook-form";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Button,
    Field,
    FieldError,
    FieldLabel,
    Input,
} from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { DadosArraste } from "./lib/arraste";
import type {
    AgrupamentoForm,
    ModeloFichaFormValues,
} from "./lib/modelo-ficha-form-schema";
import { NumberInput } from "~/shared/ui/number-input";
import { useEditor } from "./editor-contexto";
import { mensagemDaLista } from "./lib/erro-lista";
import { ListaPosicoes } from "./lista-posicoes";

interface Props {
    agrupamento: AgrupamentoForm;
    indice: number;
}

/**
 * Um agrupamento na ficha em edição: um cartão à parte, com o entalhe à
 * esquerda para trocá-lo de lugar com os outros, o nome, a quantidade de
 * repetições e os campos que se repetem.
 */
export function CartaoAgrupamento({ agrupamento, indice }: Props) {
    const { control } = useFormContext<ModeloFichaFormValues>();
    const { errors } = useFormState<ModeloFichaFormValues>();
    const { composicao, selecionado, selecionar } = useEditor();
    const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

    const caminho = `agrupamentos.${indice}` as const;
    const rotulo = agrupamento.nome.trim() || `Agrupamento ${indice + 1}`;
    const erroCampos = mensagemDaLista(errors, `${caminho}.campos`);

    const dados: DadosArraste = { tipo: "agrupamento", rotulo };
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: agrupamento.chave, data: dados });

    function remover() {
        const aberto = agrupamento.campos.some(
            (posicao) => posicao.chave === selecionado,
        );
        if (aberto) selecionar(null);
        composicao.removerAgrupamento(agrupamento.chave);
    }

    return (
        <section
            ref={setNodeRef}
            aria-label={`Agrupamento ${rotulo}`}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
            }}
            className={cn(
                "bg-muted/40 relative flex rounded-lg border",
                isDragging && "z-10 opacity-70 shadow-lg",
                erroCampos && "border-destructive",
            )}
        >
            {/* O entalhe: a faixa da esquerda é a alça do cartão inteiro. */}
            <button
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                aria-roledescription="agrupamento arrastável"
                aria-label={`Mover agrupamento ${rotulo}`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-l-lg border-r outline-none focus-visible:ring-[3px]"
            >
                <DotsSixVerticalIcon aria-hidden="true" weight="bold" />
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap items-start gap-3">
                    <Controller
                        control={control}
                        name={`${caminho}.nome`}
                        render={({ field, fieldState }) => (
                            <Field
                                data-invalid={fieldState.invalid}
                                className="min-w-48 flex-1"
                            >
                                <FieldLabel
                                    htmlFor={`${agrupamento.chave}-nome`}
                                >
                                    Nome do agrupamento
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id={`${agrupamento.chave}-nome`}
                                    placeholder="Ex.: Danças"
                                    autoComplete="off"
                                    aria-invalid={fieldState.invalid}
                                    className="bg-card h-10"
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                    <Controller
                        control={control}
                        name={`${caminho}.quantidade`}
                        render={({ field, fieldState }) => (
                            <Field
                                data-invalid={fieldState.invalid}
                                className="w-36"
                            >
                                <FieldLabel
                                    htmlFor={`${agrupamento.chave}-quantidade`}
                                >
                                    Repetições
                                </FieldLabel>
                                <NumberInput
                                    ref={field.ref}
                                    id={`${agrupamento.chave}-quantidade`}
                                    name={field.name}
                                    value={field.value}
                                    onChange={(valor) =>
                                        field.onChange(valor ?? 1)
                                    }
                                    onBlur={field.onBlur}
                                    min={1}
                                    suffix="×"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                    <Button
                        type="button"
                        variant="ghost-destructive"
                        size="icon"
                        aria-label={`Remover agrupamento ${rotulo}`}
                        className="mt-[1.375rem]"
                        onClick={() =>
                            agrupamento.campos.length > 0
                                ? setConfirmandoRemocao(true)
                                : remover()
                        }
                    >
                        <TrashIcon aria-hidden="true" />
                    </Button>
                </div>

                <ListaPosicoes
                    recipiente={{ agrupamento: agrupamento.chave }}
                    posicoes={agrupamento.campos}
                    caminho={`${caminho}.campos`}
                    rotulo={`agrupamento ${rotulo}`}
                    vazia={
                        <p>
                            Arraste campos globais para cá, ou crie um campo
                            exclusivo.
                        </p>
                    }
                />
                {erroCampos && (
                    <p role="alert" className="text-destructive text-sm">
                        {erroCampos}
                    </p>
                )}
            </div>

            <AlertDialog
                open={confirmandoRemocao}
                onOpenChange={setConfirmandoRemocao}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Remover o agrupamento {rotulo}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {agrupamento.campos.length === 1
                                ? "O campo dentro dele também sai do modelo."
                                : `Os ${agrupamento.campos.length} campos dentro dele também saem do modelo.`}{" "}
                            Campos exclusivos removidos não podem ser
                            recuperados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Manter</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-white"
                            onClick={remover}
                        >
                            Remover agrupamento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
