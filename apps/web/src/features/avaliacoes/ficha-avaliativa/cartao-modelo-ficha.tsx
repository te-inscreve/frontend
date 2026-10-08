import type { ModeloFichaMock } from "./mock-modelos-ficha";

/**
 * Um modelo de ficha na grade do seletor: a folha em proporção A4, com o nome
 * embaixo.
 *
 * A folha ainda é branca — é ali que vai entrar a miniatura do modelo quando a
 * ficha tiver conteúdo para mostrar.
 */
export function CartaoModeloFicha({ modelo }: { modelo: ModeloFichaMock }) {
    return (
        <li className="flex flex-col gap-2">
            <div
                aria-hidden="true"
                className="bg-card aspect-210/297 w-full rounded-md border shadow-xs"
            />
            <span className="truncate text-center text-sm">{modelo.nome}</span>
        </li>
    );
}
