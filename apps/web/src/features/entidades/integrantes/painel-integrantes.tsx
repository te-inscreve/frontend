"use client";

import { CheckSquareIcon } from "@phosphor-icons/react/dist/ssr/CheckSquare";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { Button } from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { BarraFiltros } from "./barra-filtros";
import { BarraSelecao } from "./barra-selecao";
import { DialogIntegrante } from "./dialog-integrante";
import { temFiltroAtivo } from "./filtros-integrantes";
import { GruposCriados } from "./grupos-criados";
import { ListaIntegrantes } from "./lista-integrantes";
import { usePainelIntegrantes } from "./use-painel-integrantes";

interface Props {
    integrantesIniciais: Integrante[];
}

/**
 * A tela de integrantes: listar, filtrar, cadastrar e agrupar.
 *
 * O cadastro abre em diálogo sobre a listagem: é uma tarefa curta, e voltar
 * para a lista logo depois — com filtro e rolagem no lugar — importa mais do
 * que ver o formulário e a lista ao mesmo tempo.
 *
 * Agrupar é um modo, e não o comportamento padrão da lista: consultar uma
 * pessoa é o que se faz aqui todo dia, montar um grupo é ocasional. Fora do
 * modo, a linha abre o detalhe de quem ela mostra.
 */
export function PainelIntegrantes({ integrantesIniciais }: Props) {
    const painel = usePainelIntegrantes(integrantesIniciais);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                    Integrantes
                </h2>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant={painel.modoSelecao ? "secondary" : "outline"}
                        onClick={painel.alternarModoSelecao}
                        aria-pressed={painel.modoSelecao}
                        disabled={painel.integrantes.length === 0}
                    >
                        {painel.modoSelecao ? (
                            <XIcon aria-hidden="true" />
                        ) : (
                            <CheckSquareIcon aria-hidden="true" />
                        )}
                        {painel.modoSelecao
                            ? "Sair da seleção"
                            : "Selecionar para agrupar"}
                    </Button>

                    <DialogIntegrante
                        aberto={painel.formAberto}
                        onAbertoChange={painel.setFormAberto}
                        onSalvar={painel.adicionarIntegrante}
                    />
                </div>
            </div>

            <BarraFiltros
                filtros={painel.filtros}
                onChange={painel.setFiltros}
                resultados={painel.visiveis.length}
                total={painel.integrantes.length}
            />

            {painel.modoSelecao && (
                <BarraSelecao
                    selecionados={painel.selecionadosIntegrantes}
                    onLimpar={painel.limparSelecao}
                    onCriarGrupo={painel.criarGrupo}
                />
            )}

            <ListaIntegrantes
                integrantes={painel.visiveis}
                selecionados={painel.selecionados}
                modoSelecao={painel.modoSelecao}
                onAlternar={painel.alternarSelecao}
                onSelecionarTodos={painel.selecionarVisiveis}
                filtrada={temFiltroAtivo(painel.filtrosAplicados)}
                gruposDaSessaoPorIntegrante={painel.gruposDaSessaoPorIntegrante}
            />

            <GruposCriados
                grupos={painel.gruposCriados}
                integrantes={painel.integrantes}
            />
        </div>
    );
}
