"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";

import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import { ConteudoCartaoGrupo } from "~/features/entidades/grupos/cartao-grupo";

interface Props {
    grupo: GrupoComPrevia;
    /** Se a formação deste grupo está a caminho do ticket. */
    aplicando: boolean;
    onAplicar: (grupo: GrupoComPrevia) => void;
}

/**
 * Um grupo como cartão clicável, no modo de inscrever.
 *
 * O mesmo miolo do cartão da grade ({@link ConteudoCartaoGrupo}), mas o
 * elemento em volta é um `button` e não um `Link`: aqui o clique não abre o
 * grupo — copia a formação dele para a inscrição. É uma ação, e não uma
 * escolha: o cartão não fica marcado depois, porque a inscrição não guarda
 * grupo nenhum, só as pessoas que vieram dele. Aplicar de novo não repete
 * ninguém.
 *
 * O sinal do canto é o "mais" de acrescentar, revelado no hover (e no foco
 * por teclado) com um leve crescer — o mesmo gesto do
 * {@link CartaoIntegranteAlternavel}. Vira spinner, sempre à vista, enquanto
 * `grupo.getById` não responde — a espera é localizada neste cartão.
 *
 * O clique vale no cartão inteiro, pelo mesmo motivo de sempre: é uma lista
 * em que se escolhe, e o alvo é o cartão, não o ícone.
 */
export function CartaoGrupoSelecao({ grupo, aplicando, onAplicar }: Props) {
    return (
        <li className="min-w-0">
            <button
                type="button"
                aria-label={`Adicionar os integrantes do grupo ${grupo.nome} à inscrição`}
                aria-busy={aplicando}
                onClick={() => onAplicar(grupo)}
                className="focus-visible:ring-ring/50 group bg-card border-border/70 hover:bg-card/50 flex h-full w-full cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
                <ConteudoCartaoGrupo
                    grupo={grupo}
                    sinal={
                        aplicando ? (
                            <SpinnerGapIcon
                                aria-hidden="true"
                                size={20}
                                className="text-muted-foreground mt-0.5 shrink-0 animate-spin"
                            />
                        ) : (
                            <PlusIcon
                                aria-hidden="true"
                                size={20}
                                weight="bold"
                                className="text-primary mt-0.5 shrink-0 opacity-0 transition duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-safe:scale-50"
                            />
                        )
                    }
                />
            </button>
        </li>
    );
}
