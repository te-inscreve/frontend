"use client";

import { useDraggable } from "@dnd-kit/core";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";

import type { CampoFicha } from "@te-inscreve/schemas";
import { cn } from "@te-inscreve/components/utils";

import type { DadosArraste } from "./lib/arraste";
import { idGlobalArraste } from "./lib/arraste";
import { exibirCampoGlobal, ROTULO_TIPO } from "./lib/campo-exibido";
import { MiniaturaCampo } from "./miniatura-campo";

/**
 * Painel da esquerda: a grade dos campos globais, que entram na ficha
 * arrastados. Ninguém os altera daqui — o cadastro deles é outro.
 */
export function CatalogoCamposGlobais({
    campos,
    id,
}: {
    campos: CampoFicha[];
    id: string;
}) {
    return (
        <section aria-labelledby={`${id}-titulo`} className="flex flex-col">
            <header className="flex flex-col gap-1 px-4 pt-4 pb-3">
                <h2 id={`${id}-titulo`} className="text-sm font-bold">
                    Campos globais
                </h2>
                <p className="text-muted-foreground text-xs">
                    Arraste para a ficha. Campos globais não podem ser
                    alterados.
                </p>
            </header>
            <ul className="grid grid-cols-2 gap-2 px-4 pb-4">
                {campos.map((campo) => (
                    <li key={campo.id}>
                        <CartaoCampoGlobalArrastavel campo={campo} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

function CartaoCampoGlobalArrastavel({ campo }: { campo: CampoFicha }) {
    const dados: DadosArraste = {
        tipo: "global",
        campoId: campo.id,
        rotulo: `Campo global ${campo.nome}`,
    };
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: idGlobalArraste(campo.id),
        data: dados,
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            aria-roledescription="campo arrastável"
            aria-label={`${campo.nome}, ${ROTULO_TIPO[campo.tipo]}`}
            className={cn(
                "focus-visible:ring-ring/50 focus-visible:outline-ring h-full cursor-grab touch-none rounded-md outline-none focus-visible:ring-[3px] focus-visible:outline-1",
                isDragging && "opacity-40",
            )}
        >
            <CartaoCampoGlobal campo={campo} />
        </div>
    );
}

/** O cartão em si — também é o que acompanha o ponteiro durante o arraste. */
export function CartaoCampoGlobal({
    campo,
    className,
}: {
    campo: CampoFicha;
    className?: string;
}) {
    const exibido = exibirCampoGlobal(campo);

    return (
        <div
            className={cn(
                "bg-card hover:border-primary/50 flex h-full flex-col gap-2 rounded-md border p-2 shadow-xs transition-colors",
                className,
            )}
        >
            <MiniaturaCampo campo={exibido} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-2 text-xs leading-tight font-semibold">
                    {campo.nome}
                </span>
                <span className="text-muted-foreground mt-auto flex items-center gap-1 text-[11px]">
                    <LockSimpleIcon aria-hidden="true" className="size-3" />
                    {ROTULO_TIPO[campo.tipo]}
                </span>
            </div>
        </div>
    );
}
