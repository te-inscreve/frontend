"use client";

import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import {
    cn,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";

import type { useInscricao } from "./use-inscricao";
import { LadoDaBancada } from "~/features/entidades/grupos/bancada";
import { ListaGruposSelecao } from "./lista-grupos-selecao";
import { ListaIntegrantesSelecao } from "./lista-integrantes-selecao";

type Inscricao = ReturnType<typeof useInscricao>;

interface Props {
    /** O nome da entidade — o título da coluna. `null` enquanto não chega. */
    entidade: string | null;
    grupos: Inscricao["grupos"];
    integrantes: Inscricao["integrantes"];
    /** O id do grupo cuja formação está a caminho do ticket, se houver. */
    grupoAplicando: number | null;
    selecionados: ReadonlySet<number>;
    onAplicarGrupo: Inscricao["aplicarGrupo"];
    onAlternarIntegrante: Inscricao["alternarIntegrante"];
    className?: string;
}

/**
 * O lado esquerdo da bancada de inscrição: o que a entidade tem, em duas
 * abas — os grupos e as pessoas.
 *
 * É uma {@link LadoDaBancada} com o slot `abas`: o título é o nome da
 * entidade, e as abas ficam no cabeçalho porque dizem *o que este lado
 * lista* — são etiqueta, como o título. O `Tabs` do Radix envolve a moldura
 * inteira porque `TabsList` (no cabeçalho) e `TabsContent` (no corpo)
 * precisam do mesmo root.
 *
 * As abas são estado do cliente, e não URL — a exceção da seção 6 de
 * `docs/fcp.md`: as duas listas já estão no cache do navegador (hidratadas
 * do `prefetch` da página), então trocar de aba não espera servidor nenhum,
 * e uma URL por aba só faria o histórico crescer a cada clique.
 *
 * `border-b-0` na `TabsList` porque o cabeçalho da moldura já desenha a
 * borda de baixo; sem isso apareceriam duas linhas. `gap-0` no `Tabs` porque
 * o vão entre lista e conteúdo é o `p-3` do corpo da moldura.
 */
export function ColunaEntidade({
    entidade,
    grupos,
    integrantes,
    grupoAplicando,
    selecionados,
    onAplicarGrupo,
    onAlternarIntegrante,
    className,
}: Props) {
    return (
        <Tabs
            defaultValue="grupos"
            className={cn("flex min-h-0 flex-col gap-0", className)}
        >
            <LadoDaBancada
                titulo={entidade ?? "Minha entidade"}
                // descricao="Escolha um grupo ou marque integrantes um a um."
                abas={
                    <TabsList
                        variant="line"
                        className="w-full justify-start border-b-0"
                    >
                        <TabsTrigger value="grupos" className="flex-none">
                            <UsersFourIcon aria-hidden="true" />
                            Grupos
                        </TabsTrigger>
                        <TabsTrigger value="integrantes" className="flex-none">
                            <UsersThreeIcon aria-hidden="true" />
                            Integrantes
                        </TabsTrigger>
                    </TabsList>
                }
                className="min-h-0 flex-1"
            >
                <TabsContent
                    value="grupos"
                    className="flex min-h-0 flex-1 flex-col gap-3"
                >
                    <ListaGruposSelecao
                        grupos={grupos.itens}
                        total={grupos.total}
                        carregando={grupos.carregando}
                        erro={grupos.erro}
                        isFetchingNextPage={grupos.isFetchingNextPage}
                        carregarMais={grupos.carregarMais}
                        filtros={grupos.filtros}
                        grupoAplicando={grupoAplicando}
                        onAplicar={onAplicarGrupo}
                    />
                </TabsContent>

                <TabsContent
                    value="integrantes"
                    className="flex min-h-0 flex-1 flex-col gap-3"
                >
                    <ListaIntegrantesSelecao
                        integrantes={integrantes.itens}
                        total={integrantes.total}
                        carregando={integrantes.carregando}
                        erro={integrantes.erro}
                        isFetchingNextPage={integrantes.isFetchingNextPage}
                        carregarMais={integrantes.carregarMais}
                        filtros={integrantes.filtros}
                        selecionados={selecionados}
                        onAlternar={onAlternarIntegrante}
                    />
                </TabsContent>
            </LadoDaBancada>
        </Tabs>
    );
}
