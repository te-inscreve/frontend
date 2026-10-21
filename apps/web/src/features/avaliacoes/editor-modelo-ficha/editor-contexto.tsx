"use client";

import { createContext, useContext } from "react";

import type { CampoFicha } from "@te-inscreve/schemas";

import type { Composicao } from "./use-composicao";

interface EditorContexto {
    /** Catálogo de campos globais por `id`, para desenhar uma posição global. */
    camposGlobais: ReadonlyMap<number, CampoFicha>;
    composicao: Composicao;
    /** `chave` da posição exclusiva aberta no painel de propriedades. */
    selecionado: string | null;
    selecionar: (chave: string | null) => void;
}

const Contexto = createContext<EditorContexto | null>(null);

export const EditorProvider = Contexto.Provider;

export function useEditor() {
    const contexto = useContext(Contexto);
    if (!contexto) {
        throw new Error("useEditor precisa estar dentro do EditorModeloFicha.");
    }
    return contexto;
}
