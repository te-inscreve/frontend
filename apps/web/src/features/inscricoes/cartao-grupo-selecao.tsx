"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";

import { cn } from "@te-inscreve/components";

import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import { ConteudoCartaoGrupo } from "~/features/entidades/grupos/cartao-grupo";

interface Props {
    grupo: GrupoComPrevia;
    /** Se é o grupo desta inscrição — só um pode ser. */
    selecionado: boolean;
    onEscolher: (grupo: GrupoComPrevia) => void;
}

/**
 * Um grupo como cartão clicável, no modo de inscrever.
 *
 * O mesmo miolo do cartão da grade ({@link ConteudoCartaoGrupo}), mas o
 * elemento em volta é um `button` e não um `Link`: aqui o clique não abre o
 * grupo — marca o grupo para se apresentar na categoria. O que diz isso é o
 * sinal do canto, que troca a seta de "abrir" pelo círculo de "marcar", e o
 * `aria-pressed`, que é como um botão de alternar se anuncia.
 *
 * Marcado, o cartão ganha a borda verde e o fundo levemente tingido, e o
 * hover vira vermelho: o próximo clique tira o grupo da inscrição, e o
 * cartão avisa antes. É o mesmo par de cores dos cartões de integrante da
 * bancada de grupo — verde para entrar, vermelho para sair.
 *
 * O clique vale no cartão inteiro, pelo mesmo motivo de sempre: é uma lista
 * em que se escolhe, e o alvo é o cartão, não o ícone.
 */
export function CartaoGrupoSelecao({ grupo, selecionado, onEscolher }: Props) {
    return (
        <li className="min-w-0">
            <button
                type="button"
                aria-pressed={selecionado}
                aria-label={
                    selecionado
                        ? `Tirar o grupo ${grupo.nome} da inscrição`
                        : `Inscrever o grupo ${grupo.nome}`
                }
                onClick={() => onEscolher(grupo)}
                className={cn(
                    "focus-visible:ring-ring/50 flex h-full w-full cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    selecionado
                        ? "border-primary bg-primary/5 hover:border-destructive/50 hover:bg-destructive/5"
                        : "bg-card border-border/70 hover:border-primary/50 hover:bg-primary/5",
                )}
            >
                <ConteudoCartaoGrupo
                    grupo={grupo}
                    sinal={
                        selecionado ? (
                            <CheckCircleIcon
                                aria-hidden="true"
                                size={20}
                                weight="fill"
                                className="text-primary mt-0.5 shrink-0"
                            />
                        ) : (
                            <PlusCircleIcon
                                aria-hidden="true"
                                size={20}
                                weight="bold"
                                className="text-muted-foreground mt-0.5 shrink-0"
                            />
                        )
                    }
                />
            </button>
        </li>
    );
}
