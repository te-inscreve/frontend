"use client";

import type { Control } from "react-hook-form";
import { useId, useRef, useState } from "react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { Controller } from "react-hook-form";

import {
    Button,
    cn,
    Field,
    FieldError,
    FieldLabel,
    Input,
} from "@te-inscreve/components";

import type { InscricaoFormValues } from "./lib/inscricao-form-schema";

interface Props {
    control: Control<InscricaoFormValues>;
}

/**
 * O nome com que a formação se apresenta, no cabeçalho do ticket — só na
 * modalidade em grupo.
 *
 * Parece texto, e não campo: sem borda, sem sombra, na linha logo abaixo do
 * título. Quem liga a edição é o lápis ao lado; até lá o `input` fica
 * `readOnly`. O `input` existe o tempo todo, e não só editando, para o
 * rótulo ter onde apontar (`htmlFor`) e a linha não mudar de altura quando a
 * edição liga.
 *
 * Enter e Esc encerram a edição em vez de enviar o formulário: o botão de
 * criar está no rodapé, e um Enter aqui é "pronto", não "inscreva". Inválido,
 * o campo fica editável sozinho — o RHF leva o foco até ele no envio, e um
 * foco num campo travado não serviria de nada.
 */
export function CampoNomeConcorrente({ control }: Props) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [editando, setEditando] = useState(false);

    return (
        <Controller
            name="nomeConcorrente"
            control={control}
            render={({ field, fieldState }) => {
                const editavel = editando || fieldState.invalid;

                return (
                    <Field data-invalid={fieldState.invalid} className="gap-1">
                        <FieldLabel htmlFor={id} className="sr-only">
                            Nome do concorrente
                        </FieldLabel>

                        <div className="flex items-center gap-1">
                            <Input
                                {...field}
                                ref={(elemento) => {
                                    field.ref(elemento);
                                    inputRef.current = elemento;
                                }}
                                id={id}
                                autoComplete="off"
                                readOnly={!editavel}
                                aria-invalid={fieldState.invalid}
                                placeholder="Nome do concorrente"
                                onBlur={() => {
                                    field.onBlur();
                                    setEditando(false);
                                }}
                                onKeyDown={(evento) => {
                                    if (
                                        evento.key === "Enter" ||
                                        evento.key === "Escape"
                                    ) {
                                        evento.preventDefault();
                                        evento.currentTarget.blur();
                                    }
                                }}
                                className={cn(
                                    "h-7 rounded-sm border-0 px-0 text-sm shadow-none focus-visible:ring-0",
                                    editavel
                                        ? "bg-muted/60 px-1.5"
                                        : "text-muted-foreground cursor-default truncate italic",
                                )}
                            />

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 shrink-0"
                                aria-label={
                                    editavel
                                        ? "Concluir o nome do concorrente"
                                        : "Editar o nome do concorrente"
                                }
                                // Sem isso o `mousedown` tira o foco do campo
                                // antes do clique, o `blur` já encerra a
                                // edição e o clique a religaria.
                                onMouseDown={(evento) =>
                                    evento.preventDefault()
                                }
                                onClick={() => {
                                    if (editavel) {
                                        inputRef.current?.blur();
                                        return;
                                    }
                                    setEditando(true);
                                    inputRef.current?.focus();
                                    inputRef.current?.select();
                                }}
                            >
                                {editavel ? (
                                    <CheckIcon aria-hidden="true" />
                                ) : (
                                    <PencilSimpleIcon aria-hidden="true" />
                                )}
                            </Button>
                        </div>

                        {fieldState.invalid && (
                            <FieldError
                                errors={[fieldState.error]}
                                className="text-xs"
                            />
                        )}
                    </Field>
                );
            }}
        />
    );
}
