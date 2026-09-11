"use client";

import { MinusCircleIcon } from "@phosphor-icons/react/dist/ssr/MinusCircle";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { motion } from "motion/react";

import { cn, EXPANSION_TRANSITION } from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    AvisoMatricula,
    ResumoIntegrante,
} from "~/features/entidades/integrantes/modal-integrante";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";

/** De que lado da tela a pessoa está: fora do grupo aberto, ou dentro dele. */
export type EstadoNoGrupo = "disponivel" | "membro";

interface Props {
    integrante: Integrante;
    estado: EstadoNoGrupo;
    /** Nome do grupo aberto — o rótulo acessível diz de onde a pessoa entra e sai. */
    grupo: string;
    onAlternar: (integrante: Integrante) => void;
}

/**
 * Uma pessoa como cartão clicável, no modo de montar grupo.
 *
 * É uma renderização à parte do {@link CartaoIntegrante}, e não uma variante
 * dele: lá o cartão inteiro é o gatilho do detalhe, e aqui o clique inclui ou
 * tira a pessoa do grupo aberto. `docs/animacoes.md` é explícito quanto a isso —
 * gatilho de modal é um `button`, e marcar dentro dele seria botão dentro de
 * botão; quando a lista também precisa marcar, isso é um modo com outra
 * renderização. Por isso o detalhe da pessoa não abre enquanto um grupo está
 * aberto: a tela está em outro assunto, e quem precisa dele volta para a grade.
 *
 * O clique vale no cartão inteiro, e não num "+" no canto: é uma lista em que se
 * escolhe gente, e um alvo de 16px dentro de um cartão de 300 seria um alvo
 * menor do que a vontade de acertá-lo. O ícone fica como sinal do que vai
 * acontecer, fora da ordem de foco.
 *
 * ## A animação
 *
 * O `layoutId` é o mesmo nos dois lados da tela, então quando a pessoa sai da
 * coluna da esquerda e aparece na formação do grupo o Motion entende que é o
 * mesmo cartão mudando de lugar: ele viaja até lá em vez de desaparecer de um
 * ponto e nascer no outro. É o mesmo recurso do cartão que vira modal — shared
 * layout animation —, com a mesma inércia (`EXPANSION_TRANSITION`), e por isso o
 * raio vai em `style` e a transição de cor é `transition-colors`: sobre o
 * `transform` quem escreve é o Motion, e uma transição de CSS na mesma
 * propriedade disputaria com ele quadro a quadro.
 *
 * `layout="position"` — e não o `layout` cheio — porque a coluna é estreita e a
 * formação é larga: animar a caixa mudando de largura esticaria o nome no meio
 * do caminho, que é exatamente o defeito que a seção 3 do documento descreve. O
 * que se anima é o trajeto; o tamanho troca no corte, coberto pelo cruzamento de
 * opacidade entre as duas instâncias.
 */
export function CartaoIntegranteSelecao({
    integrante,
    estado,
    grupo,
    onAlternar,
}: Props) {
    const membro = estado === "membro";
    const Icone = membro ? MinusCircleIcon : PlusCircleIcon;

    return (
        <li>
            <motion.button
                type="button"
                layoutId={`grupo-integrante-${integrante.id}`}
                layout="position"
                transition={EXPANSION_TRANSITION}
                style={{ borderRadius: 12 }}
                onClick={() => onAlternar(integrante)}
                aria-label={
                    membro
                        ? `Tirar ${nomeCompleto(integrante)} do grupo ${grupo}`
                        : `Incluir ${nomeCompleto(integrante)} no grupo ${grupo}`
                }
                className={cn(
                    "bg-card focus-visible:ring-ring/50 group flex w-full cursor-pointer items-center gap-3 border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    membro
                        ? "hover:border-destructive/50 hover:bg-destructive/5"
                        : "hover:border-primary/50 hover:bg-muted/50",
                )}
            >
                <AvatarUsuario
                    nome={nomeCompleto(integrante)}
                    size={36}
                    alt=""
                />

                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                        {nomeCompleto(integrante)}
                    </span>
                    <ResumoIntegrante integrante={integrante} />
                </span>

                <AvisoMatricula integrante={integrante} />

                <Icone
                    aria-hidden="true"
                    size={20}
                    weight="bold"
                    className={cn(
                        "shrink-0 transition-colors",
                        membro
                            ? "text-muted-foreground group-hover:text-destructive"
                            : "text-muted-foreground group-hover:text-primary",
                    )}
                />
            </motion.button>
        </li>
    );
}
