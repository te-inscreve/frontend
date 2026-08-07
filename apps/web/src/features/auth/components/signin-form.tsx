"use client";

import { useState } from "react";
import Link from "next/link";
import { SpinnerIcon } from "@phosphor-icons/react/dist/ssr/Spinner";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";

import { Button, Input, Label } from "@te-inscreve/components";

import { useSignIn } from "../lib/use-signin";

export function SignInForm() {
    const { entrar, erro, enviando } = useSignIn();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    return (
        <form
            className="flex w-full flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                void entrar(email, senha);
            }}
        >
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                    id="senha"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                />
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
