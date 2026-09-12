"use client";

import type { FormGrupo, Grupo } from "./grupo";
import { BotaoCriarGrupo } from "./botao-criar-grupo";
import { CartaoGrupo } from "./cartao-grupo";

interface Props {
    grupos: Grupo[];
    onAbrir: (id: number) => void;
    onCriar: (dados: FormGrupo) => Promise<void> | void;
}

/**
 * A lista de grupos da entidade — o que a tela mostra quando não há grupo
 * aberto.
 *
 * Tem a forma da listagem de integrantes: o título com a ação da tela à
 * direita, a contagem miúda embaixo e a grade solta em seguida. As duas são a
 * mesma pergunta feita sobre coisas diferentes — "o que a entidade tem" —, e
 * quem passa de um item do menu para o outro não deveria precisar reaprender
 * onde as peças estão.
 *
 * Por isso ela não usa mais a moldura da bancada ({@link LadoDaBancada}): aquela
 * moldura é do trabalho de montar formação, que só começa com um grupo aberto.
 * Fechada, a tela é uma listagem, e listagem aqui não tem painel em volta.
 *
 * Ocupa a largura inteira, e aí cabem três cartões por linha a partir do `lg`.
 * Com um grupo aberto essa largura é dividida com a cesta de integrantes, e é
 * justamente por isso que a lista some em vez de encolher.
 */
export function GradeGrupos({ grupos, onAbrir, onCriar }: Props) {
    return (
        <div className="flex flex-col gap-4">
            {/* Título e contagem em um bloco só: a contagem é a resposta do
                título, e se lê logo embaixo dele — o mesmo `gap-2` que separa a
                contagem da barra de filtros na tela de integrantes. */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold tracking-tight">Grupos</h2>

                    <BotaoCriarGrupo onCriar={onCriar} />
                </div>

                <p className="text-muted-foreground text-sm">
                    {grupos.length === 1
                        ? "1 grupo"
                        : `${grupos.length} grupos`}
                </p>
            </div>

            {grupos.length === 0 ? (
                <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                    Nenhum grupo criado. Um grupo junta integrantes para
                    inscrevê-los de uma vez.
                </p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {grupos.map((grupo) => (
                        <CartaoGrupo
                            key={grupo.id}
                            grupo={grupo}
                            onAbrir={onAbrir}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
