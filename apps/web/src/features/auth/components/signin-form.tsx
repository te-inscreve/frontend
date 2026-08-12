"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { useForm } from "react-hook-form";

import { Button, Input, Label } from "@te-inscreve/components";

import type { SignInFormValues } from "../lib/signin-schema";
import { signInFormSchema } from "../lib/signin-schema";
import { useSignIn } from "../lib/use-signin";

export function SignInForm() {
    const { entrar, erro, enviando } = useSignIn();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInFormSchema),
        defaultValues: { email: "", senha: "" },
    });

    return (
        <form
            className="flex w-full flex-col gap-4"
            noValidate
            onSubmit={handleSubmit(({ email, senha }) => entrar(email, senha))}
        >
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email && "email-erro"}
                    {...register("email")}
                />
                {errors.email && (
                    <p id="email-erro" className="text-destructive text-sm">
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                    id="senha"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.senha}
                    aria-describedby={errors.senha && "senha-erro"}
                    {...register("senha")}
                />
                {errors.senha && (
                    <p id="senha-erro" className="text-destructive text-sm">
                        {errors.senha.message}
                    </p>
                )}
            </div>

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
