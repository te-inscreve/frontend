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

import type { SignInFormValues } from "../lib/signin-schema";
import { signInFormSchema } from "../lib/signin-schema";
import { useSignIn } from "../lib/use-signin";

export function SignInForm() {
    const { entrar, erro, enviando } = useSignIn();
    const form = useForm<SignInFormValues>({
        resolver: zodResolver(signInFormSchema),
        defaultValues: { email: "", senha: "" },
    });

    return (
        <form
            className="flex w-full flex-col gap-4"
            noValidate
            onSubmit={form.handleSubmit(({ email, senha }) =>
                entrar(email, senha),
            )}
        >
            <FieldGroup>
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
                    name="senha"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="senha">Senha</FieldLabel>
                            <Input
                                {...field}
                                id="senha"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
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
                Entrar
            </Button>

            <p className="text-muted-foreground text-center text-sm">
                Não possui cadastro?{" "}
                <Link
                    href="/signup"
                    className="text-primary font-medium hover:underline"
                >
                    Cadastre-se
                </Link>
            </p>
        </form>
    );
}
