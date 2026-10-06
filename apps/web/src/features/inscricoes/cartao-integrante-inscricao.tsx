"use client";

import { PlusIcon, XIcon } from "@phosphor-icons/react";

import { cn } from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    AvisoMatricula,
    ResumoIntegrante,
} from "~/features/entidades/integrantes/modal-integrante";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";

interface Props {
    integrante: Integrante;
    /** `lista`: na lista da entidade, o clique inclui. `ticket`: o clique tira. */
    lado: "lista" | "ticket";
    onAlternar: (integrante: Integrante) => void;
    className?: string;
}

/**
 * Uma pessoa como cartão clicável, no modo de inscrever.
 *
 * Quem entra no ticket sai da lista da entidade: cada pessoa está em um
 * lugar só, na lista para incluir ou no ticket para tirar.
 *
 * A passagem de um lado a outro é saída e entrada com `AnimatePresence` nas
 * duas listas, e não `layoutId` compartilhado, porque em tela estreita o
 * ticket fica acima da lista e muitas vezes fora da tela — o cartão voaria
 * para onde ninguém vê.
 *
 * Devolve o `button`, e não o `<li>`: cada lista o embrulha num `motion.li`
 * para a linha crescer e sumir no lugar.
 */
export function CartaoIntegranteInscricao({
    integrante,
    lado,
    onAlternar,
    className,
}: Props) {
    const nome = nomeCompleto(integrante);

    return (
        <button
            type="button"
            onClick={() => onAlternar(integrante)}
            aria-label={
                lado === "ticket"
                    ? `Tirar ${nome} da inscrição`
                    : `Incluir ${nome} na inscrição`
            }
            className={cn(
                "focus-visible:ring-ring/50 group bg-card border-border/70 hover:bg-card/50 flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                className,
            )}
        >
            <AvatarUsuario nome={nome} size={36} alt="" />

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                    {nome}
                </span>
                <ResumoIntegrante integrante={integrante} />
            </span>

            <AvisoMatricula integrante={integrante} />

            <Sinal lado={lado} />
        </button>
    );
}

/** Aparece no hover (e no foco por teclado) com um leve crescer. */
const VISIVEL_NO_HOVER =
    "shrink-0 opacity-0 transition duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-safe:scale-50";

/**
 * O ícone do canto: o que o clique vai fazer, revelado no hover. Fora da
 * leitura — o `aria-label` do botão já diz.
 */
function Sinal({ lado }: { lado: Props["lado"] }) {
    return lado === "ticket" ? (
        <XIcon
            aria-hidden="true"
            size={20}
            weight="bold"
            className={cn(VISIVEL_NO_HOVER, "text-destructive")}
        />
    ) : (
        <PlusIcon
            aria-hidden="true"
            size={20}
            weight="bold"
            className={cn(VISIVEL_NO_HOVER, "text-primary")}
        />
    );
}
