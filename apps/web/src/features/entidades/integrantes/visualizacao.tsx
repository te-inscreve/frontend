"use client";

import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { TableIcon } from "@phosphor-icons/react/dist/ssr/Table";

import { Button } from "@te-inscreve/components";

/** Como a listagem se apresenta. Cartões é o padrão: identificar vem antes de comparar. */
export type Visualizacao = "cartoes" | "tabela";

/**
 * Alterna entre as duas visualizações da listagem.
 *
 * É um botão só, e não um par de opções, porque com duas alternativas o par
 * gasta o dobro do espaço para dizer a mesma coisa. O rótulo nomeia o destino —
 * "Ver em tabela" leva à tabela —, que é o que se procura ao clicar.
 */
export function SeletorVisualizacao({
    visualizacao,
    onChange,
}: {
    visualizacao: Visualizacao;
    onChange: (visualizacao: Visualizacao) => void;
}) {
    const emCartoes = visualizacao === "cartoes";

    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => onChange(emCartoes ? "tabela" : "cartoes")}
        >
            {emCartoes ? (
                <TableIcon aria-hidden="true" />
            ) : (
                <SquaresFourIcon aria-hidden="true" />
            )}
            {emCartoes ? "Ver em tabela" : "Ver em cartões"}
        </Button>
    );
}
