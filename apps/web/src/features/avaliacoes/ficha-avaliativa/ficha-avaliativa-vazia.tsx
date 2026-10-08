import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";

import { BotaoSelecionarModeloFicha } from "./botao-selecionar-modelo-ficha";

/**
 * A aba de ficha avaliativa de uma categoria que ainda não tem ficha: diz o
 * que falta e oferece, ali mesmo, o caminho para escolher um modelo.
 */
export function FichaAvaliativaVazia({ categoriaId }: { categoriaId: number }) {
    return (
        <div className="bg-card flex flex-col items-center gap-4 rounded-md border border-dashed p-8 text-center">
            <ClipboardTextIcon
                aria-hidden="true"
                className="text-muted-foreground size-10"
                weight="duotone"
            />
            <div className="flex flex-col gap-1">
                <p className="font-medium">Nenhuma ficha avaliativa</p>
                <p className="text-muted-foreground max-w-xs text-sm">
                    Escolha um modelo para definir os critérios com que os
                    avaliadores vão julgar esta categoria.
                </p>
            </div>
            <BotaoSelecionarModeloFicha categoriaId={categoriaId} />
        </div>
    );
}
