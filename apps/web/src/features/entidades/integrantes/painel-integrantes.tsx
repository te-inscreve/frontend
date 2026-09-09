"use client";

import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { BarraFiltros } from "./barra-filtros";
import { GradeIntegrantesSkeleton } from "./cartao-integrante-skeleton";
import { DialogIntegrante } from "./dialog-integrante";
import { ListaIntegrantes } from "./lista-integrantes";
import { usePainelIntegrantes } from "./use-painel-integrantes";
import { SeletorVisualizacao } from "./visualizacao";

export { INTEGRANTES_POR_PAGINA } from "./use-painel-integrantes";

/**
 * A tela de integrantes: listar, filtrar e cadastrar.
 *
 * O cadastro abre em diálogo sobre a listagem: é uma tarefa curta, e voltar
 * para a lista logo depois — com filtro e rolagem no lugar — importa mais do
 * que ver o formulário e a lista ao mesmo tempo.
 *
 * A sentinela no fim é o que pede a próxima página: um `div` de um pixel que,
 * ao entrar na tela, dispara o `fetchNextPage`. Enquanto a página chega, a
 * grade ganha uma linha de esqueletos — estrutura, e não spinner.
 */
export function PainelIntegrantes() {
    const painel = usePainelIntegrantes();
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: painel.carregarMais,
    });

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
                resultados={painel.integrantes.length}
                total={painel.total}
            />

            <ListaIntegrantes
                integrantes={painel.integrantes}
                visualizacao={painel.visualizacao}
                carregando={painel.isLoading}
                erro={painel.error}
                onEditar={painel.editarIntegrante}
            />

            {painel.isFetchingNextPage && (
                <GradeIntegrantesSkeleton quantidade={3} />
            )}

            <div ref={triggerScrollRef} aria-hidden="true" className="h-px" />
        </div>
    );
}
