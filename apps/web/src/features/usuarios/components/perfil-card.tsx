import Link from "next/link";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Separator,
} from "@te-inscreve/components";

interface Props {
    nome: string;
    email: string;
    /**
     * O avatar, que depende da foto vinda da API. Entra como slot para poder
     * chegar por streaming: nome e e-mail saem da sessão e não têm por que
     * esperar por ele. Ver `docs/fcp.md`.
     */
    avatar: React.ReactNode;
    /** Os dados que só a API sabe — hoje o CPF e o aviso de falha ou ausência. */
    dados: React.ReactNode;
}

/**
 * O cartão do perfil: o que a sessão já sabe, mais o que vem da API.
 *
 * A divisão entre os dois não é arbitrária — é ela que permite a página pintar
 * inteira antes de a API responder. Nome e e-mail vêm do cookie de sessão;
 * avatar e CPF chegam depois, cada um atrás do próprio boundary.
 */
export function PerfilCard({ nome, email, avatar, dados }: Props) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center gap-4">
                {avatar}
                <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="truncate text-2xl font-semibold">{nome}</h2>
                    <p className="text-muted-foreground truncate text-sm">
                        {email}
                    </p>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 pt-6">
                <DadoDoPerfil
                    icone={<EnvelopeSimpleIcon size={18} weight="duotone" />}
                    rotulo="E-mail"
                    valor={email}
                />
                {dados}

                <Button asChild variant="outline" className="self-start">
                    <Link href="/configuracoes">Editar perfil</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export function DadoDoPerfil({
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
