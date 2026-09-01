"use client";

import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";

import type { GrupoCriado } from "./use-painel-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";

interface Props {
    grupos: GrupoCriado[];
    integrantes: Integrante[];
}

/**
 * Os grupos montados nesta sessão da tela.
 *
 * Sem esse retorno, criar um grupo seria só a seleção sumindo. Fica claro que
 * eles ainda não foram salvos — some tudo no refresh — para que ninguém saia
 * da tela achando que a formação está registrada.
 */
export function GruposCriados({ grupos, integrantes }: Props) {
    if (grupos.length === 0) return null;

    return (
        <section className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden="true" className="text-primary flex">
                    <UsersFourIcon size={18} weight="duotone" />
                </span>
                Grupos montados agora
                <span className="text-muted-foreground text-xs font-normal">
                    ainda não salvos
                </span>
            </h2>

            <ul className="bg-card divide-y overflow-hidden rounded-xl border">
                {grupos.map((grupo) => {
                    const membros = integrantes.filter(({ id }) =>
                        grupo.integrantesIds.includes(id),
                    );

                    return (
                        <li key={grupo.id} className="flex flex-col gap-2 p-3">
                            <p className="text-sm font-semibold">
                                {grupo.nome}
                                <span className="text-muted-foreground ml-2 text-xs font-normal">
                                    {membros.length === 1
                                        ? "1 integrante"
                                        : `${membros.length} integrantes`}
                                </span>
                            </p>
                            <ul className="flex flex-wrap gap-1.5">
                                {membros.map((membro) => (
                                    <li
                                        key={membro.id}
                                        className="bg-muted rounded-full px-2.5 py-1 text-xs"
                                    >
                                        {membro.nome}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
