import Link from "next/link";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";

import type { Perfil } from "@te-inscreve/schemas";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Separator,
} from "@te-inscreve/components";

import { formatCpf } from "~/shared/utils/format-cpf";
import { AvatarUsuario } from "./avatar-usuario";

interface Props {
    nome: string;
    email: string;
    /** `null` quando a conta ainda não tem perfil cadastrado na API. */
    perfil: Perfil | null;
    /** Preenchido quando a API não respondeu — distingue "sem dados" de "falhou". */
    aviso?: string;
}

export function PerfilCard({ nome, email, perfil, aviso }: Props) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center gap-4">
                <AvatarUsuario
                    photo={perfil?.photo}
                    nome={nome}
                    size={96}
                    className="border"
                />
                <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="truncate text-2xl font-semibold">{nome}</h2>
                    <p className="text-muted-foreground truncate text-sm">
                        {email}
                    </p>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 pt-6">
                <Dado
                    icone={<EnvelopeSimpleIcon size={18} weight="duotone" />}
                    rotulo="E-mail"
                    valor={email}
                />
                <Dado
                    icone={
                        <IdentificationCardIcon size={18} weight="duotone" />
                    }
                    rotulo="CPF"
                    valor={perfil ? formatCpf(perfil.cpf) : null}
                />

                {aviso ? (
                    <p
                        role="alert"
                        className="text-destructive flex items-start gap-2 text-sm"
                    >
                        <WarningCircleIcon
                            className="mt-0.5 shrink-0"
                            size={16}
                            aria-hidden="true"
                        />
                        {aviso}
                    </p>
                ) : (
                    !perfil && (
                        <p
                            role="status"
                            className="text-muted-foreground flex items-start gap-2 text-sm"
                        >
                            <WarningCircleIcon
                                className="mt-0.5 shrink-0"
                                size={16}
                                aria-hidden="true"
                            />
                            Ainda não há um perfil cadastrado para esta conta.
                            Os dados aparecem aqui assim que forem preenchidos.
                        </p>
                    )
                )}

                <Button asChild variant="outline" className="self-start">
                    <Link href="/configuracoes">Editar perfil</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function Dado({
    icone,
    rotulo,
    valor,
}: {
    icone: React.ReactNode;
    rotulo: string;
    valor: string | null;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-muted-foreground" aria-hidden="true">
                {icone}
            </span>
            <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">{rotulo}</span>
                <span className="text-sm font-medium">
                    {valor ?? (
                        <span className="text-muted-foreground font-normal">
                            Não informado
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}
