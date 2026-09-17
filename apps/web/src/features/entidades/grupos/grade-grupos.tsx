"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import { EXPANSION_TRANSITION } from "@te-inscreve/components";

import type { FormGrupo, GrupoComPrevia } from "./grupo";
import { BotaoCriarGrupo } from "./botao-criar-grupo";
import { CartaoGrupo } from "./cartao-grupo";
import { GradeGruposSkeleton } from "./cartao-grupo-skeleton";

/** Quantos esqueletos ocupar a grade: duas linhas cheias no maior breakpoint. */
const ESQUELETOS = 6;

interface Props {
    grupos: GrupoComPrevia[];
    /** Quantos a entidade tem ao todo — a grade pode ainda não ter carregado todos. */
    total: number;
    /** Primeira página ainda no caminho. */
    carregando: boolean;
    /** A falha da primeira página; só a mensagem interessa aqui. */
    erro: { message: string } | null;
    isFetchingNextPage: boolean;
    /** A sentinela do fim da grade liga aqui; ver {@link useVerticalScroll}. */
    sentinelaRef: React.Ref<HTMLDivElement>;
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
 * onde as peças estão. Pagina do mesmo jeito também: a sentinela no fim pede a
 * próxima página, e enquanto ela chega a grade ganha uma linha de esqueletos.
 *
 * Por isso ela não usa a moldura da bancada ({@link LadoDaBancada}): aquela
 * moldura é da página do grupo (`grupos/[id]`), onde se monta a formação.
 * Aqui a tela é uma listagem, e listagem não tem painel em volta.
 *
 * Ocupa a largura inteira, e aí cabem três cartões por linha a partir do `lg`.
 * Cada `CartaoGrupo` já é um link para a página do grupo — esta grade só
 * lista e cria.
 *
 * Um cartão novo cresce no lugar em vez de simplesmente aparecer — é o que
 * acontece ao voltar da página de um grupo recém-criado, ou ao carregar mais
 * uma página da grade. Ver o `AnimatePresence` de {@link ConteudoDaGrade}.
 */
export function GradeGrupos({
    grupos,
    total,
    carregando,
    erro,
    isFetchingNextPage,
    sentinelaRef,
    onCriar,
}: Props) {
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
                    {carregando
                        ? "Carregando…"
                        : total === 1
                          ? "1 grupo"
                          : `${total} grupos`}
                </p>
            </div>

            <ConteudoDaGrade
                grupos={grupos}
                carregando={carregando}
                erro={erro}
            />

            {isFetchingNextPage && <GradeGruposSkeleton quantidade={3} />}

            <div ref={sentinelaRef} aria-hidden="true" className="h-px" />
        </div>
    );
}

/**
 * Carregando, falhar, vazio e a lista — decididos num lugar só, como na
 * {@link ListaIntegrantes}, para a mensagem não se espalhar pela grade.
 */
function ConteudoDaGrade({
    grupos,
    carregando,
    erro,
}: Pick<Props, "grupos" | "carregando" | "erro">) {
    if (carregando) return <GradeGruposSkeleton quantidade={ESQUELETOS} />;

    if (erro) {
        return (
            <p className="text-destructive flex items-center gap-2 rounded-xl border border-dashed p-6 text-sm">
                <BugIcon aria-hidden="true" size={18} />
                {erro.message}
            </p>
        );
    }

    if (grupos.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                Nenhum grupo criado. Um grupo junta integrantes para
                inscrevê-los de uma vez.
            </p>
        );
    }

    return (
        // `reducedMotion="user"` respeita quem pediu menos movimento no
        // sistema — ver a seção 5 de `docs/animacoes.md`.
        <MotionConfig reducedMotion="user">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* `initial={false}`: só o que aparece *depois* do primeiro
                    render cresce no lugar — os cartões já em tela na
                    primeira página não devem nascer animando. `popLayout`
                    tira o cartão excluído do fluxo assim que ele começa a
                    sumir, para os vizinhos já deslizarem para o lugar dele
                    em vez de esperar a saída terminar. */}
                <AnimatePresence initial={false} mode="popLayout">
                    {grupos.map((grupo) => (
                        <motion.li
                            key={grupo.id}
                            layout
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={EXPANSION_TRANSITION}
                        >
                            <CartaoGrupo grupo={grupo} />
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </MotionConfig>
    );
}
