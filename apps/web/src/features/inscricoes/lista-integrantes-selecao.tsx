"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";

import type { FiltrosIntegrantes } from "~/features/entidades/integrantes/lib/filtros-integrantes";
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
    carregarMais: () => void;
    filtros: FiltrosIntegrantes;
    onFiltrosChange: (filtros: FiltrosIntegrantes) => void;
    /** Ids de quem está no ticket — pelo grupo ou avulso. */
    selecionados: ReadonlySet<number>;
    onAlternar: (integrante: Integrante) => void;
}

/**
 * A aba "Integrantes" da coluna da entidade: a barra de recorte dos
 * integrantes — a mesma da tela deles, com faixa de idade e matrícula — e a
 * lista rolável, cada pessoa um cartão que a inclui na inscrição.
 *
 * Ao contrário da cesta da bancada de grupo, quem entra na inscrição **não
 * some** daqui: fica marcado. A lista é a entidade inteira, e o ticket é o
 * recorte dela — a pessoa que está nos dois lugares é a mesma, e a marca
 * diz isso sem esconder ninguém. É também o que deixa desmarcar de qualquer
 * um dos lados.
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
    carregarMais,
    filtros,
    onFiltrosChange,
    selecionados,
    onAlternar,
}: Props) {
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: carregarMais,
    });

    return (
        <>
            <BarraFiltros
                filtros={filtros}
                onChange={onFiltrosChange}
                resultados={integrantes.length}
                total={total}
            />

            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <ConteudoDaLista
                    integrantes={integrantes}
                    carregando={carregando}
                    erro={erro}
                    temFiltro={temFiltroAtivo(filtros)}
                    selecionados={selecionados}
                    onAlternar={onAlternar}
                />

                {isFetchingNextPage && (
                    <ul className="mt-3 grid gap-3">
                        <CartaoIntegranteSkeleton />
                        <CartaoIntegranteSkeleton />
                    </ul>
                )}

                <div
                    ref={triggerScrollRef}
                    aria-hidden="true"
                    className="h-px"
                />
            </div>
        </>
    );
}

/** Carregando, falhar, vazio e a lista — decididos num lugar só. */
function ConteudoDaLista({
    integrantes,
    carregando,
    erro,
    temFiltro,
    selecionados,
    onAlternar,
}: Pick<
    Props,
    "integrantes" | "carregando" | "erro" | "selecionados" | "onAlternar"
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
            <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                {temFiltro
                    ? "Ninguém corresponde ao que você procurou."
                    : "Nenhum integrante cadastrado. Cadastre as pessoas da entidade para inscrevê-las."}
            </p>
        );
    }

    return (
        <ul className="grid gap-3">
            {integrantes.map((integrante) => (
                <li key={integrante.id} className="min-w-0">
                    <CartaoIntegranteInscricao
                        integrante={integrante}
                        lado="lista"
                        selecionado={selecionados.has(integrante.id)}
                        onAlternar={onAlternar}
                    />
                </li>
            ))}
        </ul>
    );
}
