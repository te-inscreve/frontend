"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";

import type { FiltrosGrupos } from "~/features/entidades/grupos/filtros-grupos";
import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import { BarraFiltrosGrupos } from "~/features/entidades/grupos/barra-filtros-grupos";
import { CartaoGrupoSkeleton } from "~/features/entidades/grupos/cartao-grupo-skeleton";
import { temFiltroGrupoAtivo } from "~/features/entidades/grupos/filtros-grupos";
import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { CartaoGrupoSelecao } from "./cartao-grupo-selecao";

/** Quantos esqueletos enquanto a primeira página não chega: uma coluna cheia. */
const ESQUELETOS = 4;

interface Props {
    grupos: GrupoComPrevia[];
    total: number;
    carregando: boolean;
    erro: { message: string } | null;
    isFetchingNextPage: boolean;
    carregarMais: () => void;
    filtros: FiltrosGrupos;
    onFiltrosChange: (filtros: FiltrosGrupos) => void;
    /** O id do grupo desta inscrição, se houver. */
    grupoSelecionado: number | null;
    onEscolher: (grupo: GrupoComPrevia) => void;
}

/**
 * A aba "Grupos" da coluna da entidade: a barra de recorte e a lista rolável
 * de grupos, cada um um cartão que marca o grupo para a inscrição.
 *
 * Tem a estrutura da `ColunaIntegrantes` da bancada de grupo — barra,
 * caixa rolável, conteúdo decidido num lugar só, esqueletos da próxima
 * página, sentinela —, sem a moldura: a moldura é da coluna, que a divide
 * com a aba de integrantes.
 *
 * É a lista, e não a coluna, que chama `useVerticalScroll`: o hook observa o
 * ref uma vez, na montagem, e a `TabsContent` inativa desmonta — se o hook
 * vivesse na coluna, a sentinela da aba que voltasse a montar não seria
 * observada.
 */
export function ListaGruposSelecao({
    grupos,
    total,
    carregando,
    erro,
    isFetchingNextPage,
    carregarMais,
    filtros,
    onFiltrosChange,
    grupoSelecionado,
    onEscolher,
}: Props) {
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: carregarMais,
    });

    return (
        <>
            <BarraFiltrosGrupos
                filtros={filtros}
                onChange={onFiltrosChange}
                resultados={grupos.length}
                total={total}
            />

            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <ConteudoDaLista
                    grupos={grupos}
                    carregando={carregando}
                    erro={erro}
                    temFiltro={temFiltroGrupoAtivo(filtros)}
                    grupoSelecionado={grupoSelecionado}
                    onEscolher={onEscolher}
                />

                {isFetchingNextPage && (
                    <ul className="mt-3 grid gap-3">
                        <CartaoGrupoSkeleton />
                        <CartaoGrupoSkeleton />
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
    grupos,
    carregando,
    erro,
    temFiltro,
    grupoSelecionado,
    onEscolher,
}: Pick<
    Props,
    "grupos" | "carregando" | "erro" | "grupoSelecionado" | "onEscolher"
> & { temFiltro: boolean }) {
    if (carregando) {
        return (
            <ul className="grid gap-3">
                {Array.from({ length: ESQUELETOS }, (_, indice) => (
                    <CartaoGrupoSkeleton key={indice} />
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

    if (grupos.length === 0) {
        return (
            <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-4 text-center text-sm">
                {temFiltro
                    ? "Nenhum grupo corresponde ao que você procurou."
                    : "Nenhum grupo criado. Um grupo junta integrantes para inscrevê-los de uma vez — ou marque as pessoas uma a uma na aba Integrantes."}
            </p>
        );
    }

    return (
        // Uma coluna: a lista divide a tela com o ticket, e o cartão de grupo
        // carrega nome, descrição e avatares — em duas colunas ele trunca.
        <ul className="grid gap-3">
            {grupos.map((grupo) => (
                <CartaoGrupoSelecao
                    key={grupo.id}
                    grupo={grupo}
                    selecionado={grupo.id === grupoSelecionado}
                    onEscolher={onEscolher}
                />
            ))}
        </ul>
    );
}
