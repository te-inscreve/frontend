"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { Button } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { BarraFiltros } from "./barra-filtros";
import { BarraSelecao } from "./barra-selecao";
import { temFiltroAtivo } from "./filtros-integrantes";
import { FormIntegrante } from "./form-integrante";
import { GruposCriados } from "./grupos-criados";
import { ListaIntegrantes } from "./lista-integrantes";
import { usePainelIntegrantes } from "./use-painel-integrantes";

interface Props {
    integrantesIniciais: Integrante[];
}

/**
 * A tela de integrantes: listar, filtrar, cadastrar e agrupar.
 *
 * O formulário abre ao lado da listagem, e não numa página própria: cadastrar
 * a fila inteira de uma vez é a tarefa comum aqui, e trocar de tela a cada
 * pessoa faria perder o filtro e o lugar na lista. Em telas estreitas a coluna
 * desce para cima da listagem, que é onde o foco vai parar.
 */
export function PainelIntegrantes({ integrantesIniciais }: Props) {
    const painel = usePainelIntegrantes(integrantesIniciais);

    return (
        <div
            className={cn(
                "grid items-start gap-6",
                painel.formAberto && "lg:grid-cols-5",
            )}
        >
            {painel.formAberto && (
                <div className="lg:order-last lg:col-span-2">
                    <div className="lg:sticky lg:top-6">
                        <FormIntegrante
                            onSalvar={painel.adicionarIntegrante}
                            onCancelar={() => painel.setFormAberto(false)}
                        />
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "flex flex-col gap-4",
                    painel.formAberto && "lg:col-span-3",
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold tracking-tight">
                        Integrantes
                    </h2>

                    {!painel.formAberto && (
                        <Button
                            type="button"
                            onClick={() => painel.setFormAberto(true)}
                        >
                            <PlusIcon aria-hidden="true" />
                            Adicionar integrante
                        </Button>
                    )}
                </div>

                <BarraFiltros
                    filtros={painel.filtros}
                    onChange={painel.setFiltros}
                    resultados={painel.visiveis.length}
                    total={painel.integrantes.length}
                />

                <BarraSelecao
                    selecionados={painel.selecionadosIntegrantes}
                    onLimpar={painel.limparSelecao}
                    onCriarGrupo={painel.criarGrupo}
                />

                <ListaIntegrantes
                    integrantes={painel.visiveis}
                    selecionados={painel.selecionados}
                    onAlternar={painel.alternarSelecao}
                    onSelecionarTodos={painel.selecionarVisiveis}
                    filtrada={temFiltroAtivo(painel.filtrosAplicados)}
                />

                <GruposCriados
                    grupos={painel.gruposCriados}
                    integrantes={painel.integrantes}
                />
            </div>
        </div>
    );
}
