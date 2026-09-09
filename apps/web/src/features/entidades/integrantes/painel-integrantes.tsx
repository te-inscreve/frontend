"use client";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { BarraFiltros } from "./barra-filtros";
import { DialogIntegrante } from "./dialog-integrante";
import { temFiltroAtivo } from "./filtros-integrantes";
import { ListaIntegrantes } from "./lista-integrantes";
import { usePainelIntegrantes } from "./use-painel-integrantes";
import { SeletorVisualizacao } from "./visualizacao";

interface Props {
    integrantesIniciais: Integrante[];
}

/**
 * A tela de integrantes: listar, filtrar e cadastrar.
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

                <div className="flex items-center gap-2">
                    <SeletorVisualizacao
                        visualizacao={painel.visualizacao}
                        onChange={painel.setVisualizacao}
                    />

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

            <ListaIntegrantes
                integrantes={painel.visiveis}
                visualizacao={painel.visualizacao}
                filtrada={temFiltroAtivo(painel.filtrosAplicados)}
            />
        </div>
    );
}
