import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { PhoneIcon } from "@phosphor-icons/react/dist/ssr/Phone";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import { Badge } from "@te-inscreve/components";

import type { EntidadeMock } from "./mock-entidade";

interface Props {
    entidade: EntidadeMock;
    /** Contagens do próprio painel: dizem o tamanho da entidade sem virar métrica decorativa. */
    integrantes: number;
    grupos: number;
    trofeus: number;
}

/**
 * Identidade da entidade: quem ela é, onde fica e como falar com ela.
 *
 * O quadro com o ícone ocupa o lugar do brasão. Enquanto o upload de logo não
 * existe, ele mantém a composição que a marca vai ter depois, em vez de deixar
 * o título solto na página.
 */
export function CabecalhoEntidade({
    entidade,
    integrantes,
    grupos,
    trofeus,
}: Props) {
    return (
        <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <span
                    aria-hidden="true"
                    className="bg-primary/10 text-primary flex size-16 shrink-0 items-center justify-center rounded-xl"
                >
                    <BuildingsIcon size={32} weight="duotone" />
                </span>

                <div className="flex min-w-0 flex-col gap-1.5">
                    <h1 className="text-primary text-3xl font-extrabold tracking-tight md:text-4xl">
                        {entidade.nome}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                            <MapPinIcon aria-hidden="true" />
                            {entidade.cidade} — {entidade.estado}
                        </Badge>
                    </div>
                </div>
            </div>

            <dl className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Dado
                    icone={<IdentificationCardIcon />}
                    termo="CNPJ"
                    valor={entidade.cnpj}
                />
                <Dado
                    icone={<PhoneIcon />}
                    termo="Telefone"
                    valor={entidade.telefone}
                />
                <Dado
                    icone={<UsersThreeIcon />}
                    termo="Integrantes"
                    valor={`${integrantes} integrantes`}
                />
                <Dado
                    icone={<UsersFourIcon />}
                    termo="Grupos"
                    valor={grupos === 1 ? "1 grupo" : `${grupos} grupos`}
                />
                <Dado
                    icone={<TrophyIcon />}
                    termo="Premiações"
                    valor={
                        trofeus === 1 ? "1 premiação" : `${trofeus} premiações`
                    }
                />
            </dl>
        </header>
    );
}

function Dado({
    icone,
    termo,
    valor,
}: {
    icone: React.ReactNode;
    termo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <span aria-hidden="true" className="flex [&_svg]:size-4">
                {icone}
            </span>
            {/* O termo fica só para o leitor de tela: na tela, o ícone e o
                próprio valor já dizem do que se trata. */}
            <dt className="sr-only">{termo}</dt>
            <dd>{valor}</dd>
        </div>
    );
}
