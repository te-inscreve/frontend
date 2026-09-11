"use client";

import type { FormGrupo, Grupo } from "./grupo";
import { BotaoCriarGrupo } from "./botao-criar-grupo";
import { CartaoGrupo } from "./cartao-grupo";
import { contagemIntegrantes } from "./grupo";

interface Props {
    grupos: Grupo[];
    onAbrir: (id: number) => void;
    onCriar: (dados: FormGrupo) => Promise<void> | void;
}

/**
 * A grade de grupos da entidade.
 *
 * Dois por linha a partir do `sm`, e não três: o cartão precisa caber o nome
 * inteiro e a descrição em duas linhas, e esta metade da tela já divide espaço
 * com a coluna de integrantes.
 *
 * O vazio não é um parágrafo à parte — é o próprio atalho de criar ocupando a
 * grade e explicando para que serve um grupo. Uma caixa só, em vez de um aviso
 * com um botão embaixo.
 */
export function GradeGrupos({ grupos, onAbrir, onCriar }: Props) {
    const integrantesAgrupados = grupos.reduce(
        (soma, grupo) => soma + grupo.totalIntegrantes,
        0,
    );

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight">Grupos</h2>
                <p className="text-muted-foreground text-sm">
                    {grupos.length === 0
                        ? "Um grupo junta integrantes para inscrevê-los de uma vez."
                        : `${grupos.length === 1 ? "1 grupo" : `${grupos.length} grupos`} · ${contagemIntegrantes(integrantesAgrupados)} em grupos.`}
                </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
                {grupos.map((grupo) => (
                    <CartaoGrupo
                        key={grupo.id}
                        grupo={grupo}
                        onAbrir={onAbrir}
                    />
                ))}

                <BotaoCriarGrupo
                    onCriar={onCriar}
                    sozinho={grupos.length === 0}
                />
            </ul>
        </section>
    );
}
