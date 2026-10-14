"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";

import type { CampoFicha } from "@te-inscreve/schemas";
import { Input } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { DadosArraste } from "./lib/arraste";
import type { FiltrosCatalogo } from "./lib/filtros-catalogo-schema";
import { CartaoCampo } from "./cartao-campo";
import { DialogFiltrosCatalogo } from "./dialog-filtros-catalogo";
import { idGlobalArraste } from "./lib/arraste";
import { exibirCampoGlobal, ROTULO_TIPO } from "./lib/campo-exibido";
import { filtrosCatalogoVazios } from "./lib/filtros-catalogo-schema";

/**
 * Painel da esquerda: a lista dos campos globais, um por linha, que entram
 * na ficha arrastados. Ninguém os altera daqui — o cadastro deles é outro.
 */
export function CatalogoCamposGlobais({
    campos,
    id,
}: {
    campos: CampoFicha[];
    id: string;
}) {
    const [busca, setBusca] = useState("");
    const [filtros, setFiltros] = useState(filtrosCatalogoVazios);
    const visiveis = filtrarCampos(campos, busca, filtros);

    return (
        <section aria-labelledby={`${id}-titulo`} className="flex flex-col">
            <header className="flex flex-col gap-1 px-4 pt-4 pb-3">
                <h2
                    id={`${id}-titulo`}
                    className="text-primary text-base font-bold"
                >
                    Campos prontos
                </h2>
            </header>
            <div className="flex flex-col gap-2 px-4 pb-4">
                <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                        <MagnifyingGlassIcon
                            aria-hidden="true"
                            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        />
                        <Input
                            id={`${id}-busca`}
                            type="search"
                            value={busca}
                            onChange={(evento) => setBusca(evento.target.value)}
                            placeholder="Buscar campo"
                            aria-label="Buscar campo global por nome"
                            className="h-9 pl-9"
                            autoComplete="off"
                        />
                    </div>
                    <DialogFiltrosCatalogo
                        id={id}
                        filtros={filtros}
                        aoAplicar={setFiltros}
                    />
                </div>
                <span className="text-muted-foreground text-xs">
                    {visiveis.length}{" "}
                    {campos.length !== visiveis.length
                        ? `de ${campos.length}`
                        : ""}{" "}
                    campos globais
                </span>
                {visiveis.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {visiveis.map((campo) => (
                            <li key={campo.id}>
                                <CartaoCampoGlobalArrastavel campo={campo} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p
                        aria-live="polite"
                        className="text-muted-foreground py-6 text-center text-xs"
                    >
                        Nenhum campo global encontrado.
                    </p>
                )}
            </div>
        </section>
    );
}

/** Pelo tipo e pelo nome, sem diferenciar maiúsculas nem acentos. */
function filtrarCampos(
    campos: CampoFicha[],
    busca: string,
    filtros: FiltrosCatalogo,
): CampoFicha[] {
    const procurado = normalizar(busca.trim());

    return campos.filter(
        (campo) =>
            (!filtros.tipo || campo.tipo === filtros.tipo) &&
            (!procurado || normalizar(campo.nome).includes(procurado)),
    );
}

function normalizar(texto: string) {
    return texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
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
    return (
        <CartaoCampo
            campo={exibirCampoGlobal(campo)}
            global
            className={className}
        />
    );
}
