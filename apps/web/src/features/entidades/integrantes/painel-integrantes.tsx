"use client";

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
 */
export function PainelIntegrantes({ integrantesIniciais }: Props) {
    const painel = usePainelIntegrantes(integrantesIniciais);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                    Integrantes
                </h2>

                <DialogIntegrante
                    aberto={painel.formAberto}
                    onAbertoChange={painel.setFormAberto}
                    onSalvar={painel.adicionarIntegrante}
                />
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
    );
}
