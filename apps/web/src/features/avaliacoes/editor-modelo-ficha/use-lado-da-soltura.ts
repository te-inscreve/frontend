"use client";

import { useDndContext } from "@dnd-kit/core";
import { useFormContext } from "react-hook-form";

import type { ModeloFichaFormValues } from "./lib/modelo-ficha-form-schema";
import { ladoDaSoltura } from "./lib/arraste";
import { chaveDoItem, sequenciaDaFicha } from "./lib/modelo-ficha-form-schema";

/**
 * De que lado do item do topo `chave` cai o que está sendo arrastado sobre
 * ele — para desenhar a linha que marca o ponto. Lê a ficha sem assinar: o
 * formulário não muda no meio de um arraste, e quem redesenha é o contexto do
 * dnd-kit, a cada alvo novo.
 */
export function useLadoDaSoltura(chave: string) {
    const { active, over } = useDndContext();
    const { getValues } = useFormContext<ModeloFichaFormValues>();

    if (over?.id !== chave) return null;
    return ladoDaSoltura(
        active,
        over,
        chave,
        sequenciaDaFicha(getValues()).map(chaveDoItem),
    );
}
