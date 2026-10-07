"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { AnimatePresence } from "motion/react";

import type { FiltrosIntegrantesForm } from "~/features/entidades/integrantes/lib/use-filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { BarraFiltros } from "~/features/entidades/integrantes/barra-filtros";
import {
    CartaoIntegranteAlternavel,
    LinhaAlternavel,
} from "~/features/entidades/integrantes/cartao-integrante-alternavel";
import { CartaoIntegranteSkeleton } from "~/features/entidades/integrantes/cartao-integrante-skeleton";
import { JaMovidos } from "~/features/entidades/integrantes/ja-movidos";
import { temFiltroAtivo } from "~/features/entidades/integrantes/lib/filtros-integrantes";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { LadoDaBancada } from "./bancada";

/** Quantos esqueletos enquanto a primeira página não chega: uma coluna cheia. */
const ESQUELETOS = 5;

interface Props {
    integrantes: Integrante[];
    total: number;
    carregando: boolean;
    erro: { message: string } | null;
    isFetchingNextPage: boolean;
    /** A sentinela do fim da lista liga aqui; ver {@link useVerticalScroll}. */
    sentinelaRef: React.Ref<HTMLDivElement>;
    filtros: FiltrosIntegrantesForm;
    /** O nome do grupo sendo montado — para onde vai quem for clicado aqui. */
    grupo: string;
    /**
     * Se a entidade não tem integrante nenhum cadastrado. A cesta vazia tem duas
     * causas opostas — ninguém cadastrado, ou todo mundo já dentro do grupo — e a
     * contagem não as distingue: as duas dão zero disponíveis.
     */
    entidadeVazia: boolean;
    /** Quantos da formação o recorte mostraria — a linha do fim os conta. */
    noGrupo: number;
    onAlternarIntegrante: (integrante: Integrante) => void;
    className?: string;
}

/**
 * A cesta de integrantes da entidade: o lado de onde se tira gente.
 *
 * Só existe com um grupo aberto, e é isso que a define. Ela não é a listagem de
 * integrantes da entidade — essa tem tela própria, com detalhe e cadastro — mas
 * o material de uma tarefa: cada cartão daqui é uma opção a mandar para o grupo,
 * e quem entra no grupo some da cesta para aparecer do outro lado.
 *
 * Fora de um grupo aberto ela não teria o que fazer. Os cartões não abrem o
 * detalhe da pessoa (ver {@link CartaoIntegranteAlternavel}), então, sem destino, a
 * lista viraria uma cópia inerte da tela de integrantes ao lado da grade de
 * grupos — ocupando a metade da tela sem responder a clique nenhum.
 *
 * O recorte fica: buscar por nome e filtrar é justamente como se separa quem
 * entra no grupo. Mandar de uma vez quem sobrou do filtro é da seta entre as
 * duas mãos ({@link SetaDaBancada}), e não de um botão aqui dentro: a seta já
 * anunciava o sentido, e um botão repetindo a mesma frase ficava entre o filtro
 * e a lista sem precisar estar ali.
 *
 * A rolagem é da cesta, e não da página, para a lista de gente e a formação
 * andarem separadas. Para a entidade não parecer encolher, uma linha discreta
 * no fim conta quantos já foram para o grupo ({@link JaMovidos}).
 */
export function ColunaIntegrantes({
    integrantes,
    total,
    carregando,
    erro,
    isFetchingNextPage,
    sentinelaRef,
    filtros,
    grupo,
    entidadeVazia,
    noGrupo,
    onAlternarIntegrante,
    className,
}: Props) {
    return (
        <LadoDaBancada
            titulo="Integrantes"
            descricao={
                <>
                    Clique em alguém para incluir no grupo{" "}
                    <span className="text-foreground font-semibold">
                        {grupo}
                    </span>
                    .
                </>
            }
            className={className}
        >
            <BarraFiltros
                filtros={filtros}
                resultados={integrantes.length}
                total={total}
            />

            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <ConteudoDaCesta
                    integrantes={integrantes}
                    carregando={carregando}
                    erro={erro}
                    temFiltro={temFiltroAtivo(filtros.valores)}
                    grupo={grupo}
                    entidadeVazia={entidadeVazia}
                    onAlternarIntegrante={onAlternarIntegrante}
                />

                {isFetchingNextPage && (
                    <ul className="mt-3 grid gap-3">
                        <CartaoIntegranteSkeleton />
                        <CartaoIntegranteSkeleton />
                    </ul>
                )}

                <JaMovidos quantidade={noGrupo} destino="no grupo" />

                <div ref={sentinelaRef} aria-hidden="true" className="h-px" />
            </div>
        </LadoDaBancada>
    );
}

/**
 * Carregando, falhar, vazio e a lista — decididos num lugar só, como na
 * {@link ListaIntegrantes}, para a mensagem não se espalhar pelo painel.
 */
function ConteudoDaCesta({
    integrantes,
    carregando,
    erro,
    temFiltro,
    grupo,
    entidadeVazia,
    onAlternarIntegrante,
}: Pick<
    Props,
    | "integrantes"
    | "carregando"
    | "erro"
    | "grupo"
    | "entidadeVazia"
    | "onAlternarIntegrante"
> & { temFiltro: boolean }) {
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

    if (integrantes.length === 0) {
        return (
            <p className="text-muted-foreground bg-card rounded-lg border border-dashed p-4 text-center text-sm">
                {temFiltro
                    ? "Ninguém corresponde ao que você procurou."
                    : entidadeVazia
                      ? "Nenhum integrante cadastrado. Cadastre as pessoas da entidade para montar os grupos."
                      : `Todo mundo da entidade já está no grupo ${grupo}.`}
            </p>
        );
    }

    return (
        <ul className="grid gap-3">
            {/* As mesmas entrada e saída das linhas da formação: a pessoa some
                daqui enquanto cresce lá, e volta quando sai de lá. */}
            <AnimatePresence initial={false} mode="popLayout">
                {integrantes.map((integrante) => (
                    <LinhaAlternavel key={integrante.id}>
                        <CartaoIntegranteAlternavel
                            integrante={integrante}
                            acao="incluir"
                            rotulo={`Incluir ${nomeCompleto(integrante)} no grupo ${grupo}`}
                            onAlternar={onAlternarIntegrante}
                        />
                    </LinhaAlternavel>
                ))}
            </AnimatePresence>
        </ul>
    );
}
