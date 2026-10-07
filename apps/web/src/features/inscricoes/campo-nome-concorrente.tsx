"use client";

import type { Control } from "react-hook-form";
import { useEffect, useId, useRef, useState } from "react";
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
 * Parece texto, e não campo: na leitura é um `span`, na linha logo abaixo do
 * título. Quem liga a edição é o lápis ao lado, que troca o `span` pelo
 * `input` e o check. O foco vai para o `input` num efeito, e não no clique:
 * no clique ele ainda não está montado, e o `ref` seria `null`.
 *
 * Enter e Esc encerram a edição em vez de enviar o formulário: o botão de
 * criar está no rodapé, e um Enter aqui é "pronto", não "inscreva". Inválido,
 * o campo fica editável sozinho — o RHF leva o foco até ele no envio, e um
 * foco num campo travado não serviria de nada.
 *
 * Focar o campo também liga a edição (`onFocus`): sem isso, o campo aberto
 * só pelo erro fecharia na primeira letra — digitar revalida, o erro some, e
 * com ele o motivo de o `input` estar montado. Aberto assim, ele só fecha no
 * `blur`, como o aberto pelo lápis.
 */
export function CampoNomeConcorrente({ control }: Props) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [editando, setEditando] = useState(false);

    useEffect(() => {
        // Já focado é a edição ligada pelo próprio foco: selecionar tudo ali
        // atropelaria o cursor de quem clicou no meio do texto.
        if (!editando || document.activeElement === inputRef.current) return;
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [editando]);

    return (
        <Controller
            name="nomeConcorrente"
            control={control}
            render={({ field, fieldState }) => {
                const editavel = editando || fieldState.invalid;

                return (
                    <Field
                        data-invalid={fieldState.invalid}
                        className="flex w-full flex-row items-start gap-2"
                    >
                        <FieldLabel
                            htmlFor={id}
                            className="text-muted-foreground flex h-7 items-center text-nowrap"
                        >
                            Nome do Grupo:
                        </FieldLabel>
                        <div className="flex w-full flex-col gap-1">
                            <div className="flex w-full items-center gap-1">
                                {editavel ? (
                                    <>
                                        <Input
                                            {...field}
                                            ref={(elemento) => {
                                                field.ref(elemento);
                                                inputRef.current = elemento;
                                            }}
                                            id={id}
                                            autoComplete="off"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Sem nome"
                                            onFocus={() => setEditando(true)}
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
                                                "bg-muted/60 px-1.5",
                                            )}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="size-7 shrink-0"
                                            aria-label="Concluir o nome do concorrente"
                                            // Sem isso o `mousedown` tira o foco do
                                            // campo antes do clique, e o `blur` já
                                            // trocaria este botão pelo lápis.
                                            onMouseDown={(evento) =>
                                                evento.preventDefault()
                                            }
                                            onClick={() =>
                                                inputRef.current?.blur()
                                            }
                                        >
                                            <CheckIcon aria-hidden="true" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-fit text-sm">
                                            {field.value || "---------"}
                                        </span>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="size-7 shrink-0"
                                            aria-label="Editar o nome do concorrente"
                                            onClick={() => setEditando(true)}
                                        >
                                            <PencilSimpleIcon aria-hidden="true" />
                                        </Button>
                                    </>
                                )}
                            </div>
                            {fieldState.invalid && (
                                <FieldError
                                    errors={[fieldState.error]}
                                    className="text-xs"
                                />
                            )}
                        </div>
                    </Field>
                );
            }}
        />
    );
}
