"use client";

import { useMemo } from "react";
import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { AnimatePresence, motion } from "motion/react";

import { EXPANSION_TRANSITION, Separator } from "@te-inscreve/components";

import type { FiltrosIntegrantesForm } from "~/features/entidades/integrantes/lib/use-filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { BarraFiltros } from "~/features/entidades/integrantes/barra-filtros";
import { CartaoIntegranteSkeleton } from "~/features/entidades/integrantes/cartao-integrante-skeleton";
import { temFiltroAtivo } from "~/features/entidades/integrantes/lib/filtros-integrantes";
import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { CartaoIntegranteInscricao } from "./cartao-integrante-inscricao";

/** Quantos esqueletos enquanto a primeira página não chega: uma coluna cheia. */
const ESQUELETOS = 5;

interface Props {
    integrantes: Integrante[];
    total: number;
    carregando: boolean;
    erro: { message: string } | null;
    isFetchingNextPage: boolean;
    /** Ainda há páginas no servidor — a lista carregada não é a entidade toda. */
    temMais: boolean;
    carregarMais: () => void;
    filtros: FiltrosIntegrantesForm;
    /** Quem está no ticket — pelo grupo ou avulso. */
    inscritos: Integrante[];
    onAlternar: (integrante: Integrante) => void;
}

/**
 * A aba "Integrantes" da coluna da entidade: a barra de recorte dos
 * integrantes — a mesma da tela deles, com faixa de idade e matrícula — e a
 * lista rolável, cada pessoa um cartão que a inclui na inscrição.
 *
 * Como na cesta da bancada de grupo, quem entra na inscrição **sai** daqui:
 * a lista é quem ainda falta, e cada pessoa é clicável em um lugar só — aqui
 * para incluir, no ticket para tirar. Para a entidade não parecer encolher,
 * uma linha discreta no fim conta quantos saíram ({@link JaInscritos}).
 *
 * Chama `useVerticalScroll` por conta própria pelo motivo anotado em
 * {@link ListaGruposSelecao}: a aba inativa desmonta.
 */
export function ListaIntegrantesSelecao({
    integrantes,
    total,
    carregando,
    erro,
    isFetchingNextPage,
    temMais,
    carregarMais,
    filtros,
    inscritos,
    onAlternar,
}: Props) {
    const disponiveis = useMemo(() => {
        const selecionados = new Set(inscritos.map(({ id }) => id));
        return integrantes.filter(({ id }) => !selecionados.has(id));
    }, [integrantes, inscritos]);
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: carregarMais,
    });

    return (
        <>
            <BarraFiltros
                filtros={filtros}
                resultados={integrantes.length}
                total={total}
            />

            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <ConteudoDaLista
                    integrantes={integrantes}
                    disponiveis={disponiveis}
                    carregando={carregando}
                    erro={erro}
                    temMais={temMais}
                    temFiltro={temFiltroAtivo(filtros.valores)}
                    onAlternar={onAlternar}
                />

                {/* Com a lista vazia esperando a próxima página, os esqueletos
                    são os do `ConteudoDaLista` — aqui seriam dobrados. */}
                {isFetchingNextPage && disponiveis.length > 0 && (
                    <ul className="mt-3 grid gap-3">
                        <CartaoIntegranteSkeleton />
                        <CartaoIntegranteSkeleton />
                    </ul>
                )}

                <JaInscritos quantidade={inscritos.length} />

                <div
                    ref={triggerScrollRef}
                    aria-hidden="true"
                    className="h-px"
                />
            </div>
        </>
    );
}

/**
 * Quantos já estão no ticket, numa linha miúda fechando a lista — os nomes
 * estão no próprio ticket. Some quando o ticket está vazio. `aria-live`
 * para anunciar cada inclusão: o cartão clicado some, e sem isso o leitor de
 * tela não diria para onde foi.
 */
function JaInscritos({ quantidade }: { quantidade: number }) {
    if (quantidade === 0) return null;

    return (
        <div className="text-muted-foreground mt-3 flex items-center gap-2.5 py-1 text-xs">
            <Separator className="w-auto flex-1" />

            <span aria-live="polite">
                {quantidade === 1
                    ? "+ 1 integrante inscrito"
                    : `+ ${quantidade} integrantes inscritos`}
            </span>
            {/* `w-auto` desfaz o `w-full` do `Separator`, que com
                `shrink-0` estouraria a linha. */}
            <Separator className="w-auto flex-1" />
        </div>
    );
}

/** Carregando, falhar, vazio e a lista — decididos num lugar só. */
function ConteudoDaLista({
    integrantes,
    disponiveis,
    carregando,
    erro,
    temMais,
    temFiltro,
    onAlternar,
}: Pick<
    Props,
    "integrantes" | "carregando" | "erro" | "temMais" | "onAlternar"
> & { disponiveis: Integrante[]; temFiltro: boolean }) {
    if (carregando) {
        return (
            <ul className="grid gap-3">
                {Array.from({ length: ESQUELETOS }, (_, indice) => (
                    <CartaoIntegranteSkeleton key={indice} />
                ))}
            </ul>
        );
    }

    if (erro) {
        return (
            <p className="text-destructive flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm">
                <BugIcon aria-hidden="true" size={18} />
                {erro.message}
            </p>
        );
    }

    if (disponiveis.length === 0) {
        // O filtro e a retirada dos selecionados correm sobre as páginas já
        // carregadas: vazio aqui não é vazio no servidor. Enquanto houver
        // página, o gatilho do fim — agora à vista — busca a próxima, e
        // nenhuma das mensagens abaixo seria verdade ainda.
        if (temMais) {
            return (
                <ul className="grid gap-3">
                    <CartaoIntegranteSkeleton />
                    <CartaoIntegranteSkeleton />
                </ul>
            );
        }

        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                {mensagemDeVazio(integrantes.length > 0, temFiltro)}
            </p>
        );
    }

    return (
        <ul className="grid gap-3">
            {/* As mesmas entrada e saída das linhas do ticket: a pessoa some
                daqui enquanto cresce lá, e volta quando sai de lá. */}
            <AnimatePresence initial={false} mode="popLayout">
                {disponiveis.map((integrante) => (
                    <motion.li
                        key={integrante.id}
                        className="min-w-0"
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={EXPANSION_TRANSITION}
                    >
                        <CartaoIntegranteInscricao
                            integrante={integrante}
                            lado="lista"
                            onAlternar={onAlternar}
                        />
                    </motion.li>
                ))}
            </AnimatePresence>
        </ul>
    );
}

/** Por que não sobrou ninguém: todos já entraram, o filtro, ou a entidade. */
function mensagemDeVazio(todosNaInscricao: boolean, temFiltro: boolean) {
    if (todosNaInscricao) {
        return temFiltro
            ? "Todos que correspondem ao que você procurou já estão na inscrição."
            : "Todos os integrantes já estão na inscrição.";
    }
    return temFiltro
        ? "Ninguém corresponde ao que você procurou."
        : "Nenhum integrante cadastrado. Cadastre as pessoas da entidade para inscrevê-las.";
}
