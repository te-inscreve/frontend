"use client";

import type { Transition } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { motion } from "motion/react";

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
    /** `incluir`: na lista de onde se tira gente. `tirar`: no destino. */
    acao: "incluir" | "tirar";
    /** O rótulo acessível do clique — diz para onde a pessoa vai ou de onde sai. */
    rotulo: string;
    onAlternar: (integrante: Integrante) => void;
    className?: string;
}

/**
 * Uma pessoa como cartão clicável nas bancadas de montar gente: a de grupo e
 * a de inscrição. Num lado o clique inclui, no outro tira.
 *
 * É uma renderização à parte do {@link CartaoIntegrante}, e não uma variante
 * dele: lá o cartão inteiro é o gatilho do detalhe, e aqui o clique move a
 * pessoa. `docs/animacoes.md` é explícito quanto a isso — gatilho de modal é
 * um `button`, e marcar dentro dele seria botão dentro de botão.
 *
 * O clique vale no cartão inteiro, e não num "+" no canto: um alvo de 16px
 * dentro de um cartão de 300 seria menor do que a vontade de acertá-lo. O
 * ícone é o sinal do que vai acontecer, revelado no hover (e no foco por
 * teclado) com um leve crescer, e fica fora da leitura — o `aria-label` já
 * diz. A cor do ícone é a da ação: verde de incluir, vermelho de tirar. Em
 * repouso ele não ocupa lugar, e o aviso de matrícula fica na ponta direita;
 * no hover o aviso desliza para a esquerda e abre a vaga do ícone.
 *
 * Quem entra no destino sai da lista: cada pessoa está em um lugar só. A
 * passagem é saída e entrada nas duas listas ({@link LinhaAlternavel}), e
 * não `layoutId` compartilhado, porque em tela estreita o destino fica acima
 * da lista e muitas vezes fora da tela — o cartão voaria para onde ninguém vê.
 *
 * Devolve o `button`, e não o `<li>`: cada lista o embrulha numa
 * {@link LinhaAlternavel}.
 */
export function CartaoIntegranteAlternavel({
    integrante,
    acao,
    rotulo,
    onAlternar,
    className,
}: Props) {
    const nome = nomeCompleto(integrante);
    const tirar = acao === "tirar";
    const Icone = tirar ? XIcon : PlusIcon;

    return (
        <button
            type="button"
            onClick={() => onAlternar(integrante)}
            aria-label={rotulo}
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

            {/* O ícone não ocupa lugar até o hover: em repouso a vaga tem
                largura zero e devolve o `gap` (`-ml-3`), e o aviso de
                matrícula fica colado na borda direita. No hover a vaga abre
                e empurra o aviso para a esquerda enquanto o ícone cresce.
                Com movimento reduzido, a vaga abre sem deslizar. */}
            <span
                aria-hidden="true"
                className="-ml-3 flex w-0 shrink-0 justify-end overflow-hidden transition-[width,margin] duration-150 ease-out group-hover:ml-0 group-hover:w-5 group-focus-visible:ml-0 group-focus-visible:w-5 motion-reduce:transition-none"
            >
                <Icone
                    size={20}
                    weight="bold"
                    className={cn(
                        "shrink-0 opacity-0 transition duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-safe:scale-50",
                        tirar ? "text-destructive" : "text-primary",
                    )}
                />
            </span>
        </button>
    );
}

/**
 * O tempo das linhas: curto, porque é a resposta a um clique e quem monta
 * uma formação clica em sequência — uma linha que ainda anima quando vem o
 * próximo clique faz a lista parecer atrasada.
 *
 * Entrada e saída são tweens, e não a mola do `EXPANSION_TRANSITION`: a mola
 * leva a opacidade junto e deixa uma cauda longa. A saída é mais curta que a
 * entrada — o que sai não precisa ser visto saindo. As vizinhas deslizam
 * (`layout`) com uma mola dura, que assenta rápido sem quicar.
 */
const ENTRADA: Transition = {
    duration: 0.15,
    ease: "easeOut",
    layout: { type: "spring", stiffness: 600, damping: 45 },
};
const SAIDA: Transition = { duration: 0.1, ease: "easeIn" };

/**
 * A linha de lista que cresce ao entrar e some ao sair — a mesma nos dois
 * lados da bancada, para a pessoa sumir de um enquanto aparece no outro.
 *
 * Vai dentro de um `AnimatePresence initial={false} mode="popLayout"`:
 * `initial={false}` para o que já está na lista na primeira pintura não
 * nascer animando, e `popLayout` para a linha que sai deixar o fluxo na hora
 * e as vizinhas deslizarem sem esperar.
 *
 * `min-w-0` porque item de grade nasce com `min-width: auto` e não encolhe
 * abaixo do conteúdo — em tela estreita o nome empurrava o ícone para fora.
 */
export function LinhaAlternavel({ children }: { children: React.ReactNode }) {
    return (
        <motion.li
            className="min-w-0"
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: SAIDA }}
            transition={ENTRADA}
        >
            {children}
        </motion.li>
    );
}
