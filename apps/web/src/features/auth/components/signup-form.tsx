"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { Controller, useForm } from "react-hook-form";

import {
    Button,
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    Input,
} from "@te-inscreve/components";

import type { SignUpFormValues } from "../lib/signup-schema";
import { formatCpf } from "~/shared/utils/format-cpf";
import { signUpFormSchema } from "../lib/signup-schema";
import { useSignUp } from "../lib/use-signup";
import { PasswordInput } from "./password-input";

export function SignUpForm() {
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpFormSchema),
        defaultValues: {
            email: "",
            nomeCompleto: "",
            cpf: "",
            senha: "",
            confirmacaoSenha: "",
        },
    });
    // O `setError` vai para o hook para que a recusa da API caia no campo que a
    // causou, e não só num alerta acima do botão.
    const { cadastrar, erro, enviando } = useSignUp({
        setError: form.setError,
    });

    return (
        <form
            className="flex w-full flex-col gap-4"
            noValidate
            onSubmit={form.handleSubmit(cadastrar)}
        >
            <FieldGroup>
                <Controller
                    name="nomeCompleto"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="nomeCompleto">
                                Nome completo
                            </FieldLabel>
                            <Input
                                {...field}
                                id="nomeCompleto"
                                autoComplete="name"
                                placeholder="Ana Beatriz Silva"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="email">E-mail</FieldLabel>
                            <Input
                                {...field}
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="voce@exemplo.com"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="cpf"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                            <Input
                                {...field}
                                id="cpf"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="000.000.000-00"
                                aria-invalid={fieldState.invalid}
                                // A API guarda o CPF formatado, então a máscara
                                // é aplicada no valor do próprio campo.
                                onChange={(evento) =>
                                    field.onChange(
                                        formatCpf(evento.target.value),
                                    )
                                }
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="senha"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="senha">Senha</FieldLabel>
                            <PasswordInput
                                {...field}
                                id="senha"
                                autoComplete="new-password"
                                placeholder="Ao menos 8 caracteres"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="confirmacaoSenha"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="confirmacaoSenha">
                                Confirmar senha
                            </FieldLabel>
                            <PasswordInput
                                {...field}
                                id="confirmacaoSenha"
                                autoComplete="new-password"
                                placeholder="Repita a senha"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
            </FieldGroup>

            {erro && (
                <p role="alert" className="text-destructive text-sm">
                    <WarningCircleIcon
                        className="mr-1 inline-flex align-text-bottom"
                        size={16}
                    />
                    {erro}
                </p>
            )}

            <Button
                type="submit"
                disabled={enviando}
                className="hover:cursor-pointer"
            >
                {enviando && <SpinnerIcon className="animate-spin" size={16} />}
                Criar conta
            </Button>

            <p className="text-muted-foreground text-center text-sm">
                Já possui cadastro?{" "}
                <Link
                    href="/signin"
                    className="text-primary font-medium hover:underline"
                >
                    Entrar
                </Link>
            </p>
        </form>
    );
}
