"use client";

import { useState } from "react";
import { FilePdfIcon } from "@phosphor-icons/react/dist/ssr/FilePdf";

import { cn } from "@te-inscreve/components/utils";

interface CampoRegulamentoProps {
    id: string;
    file: File | null;
    onChange: (file: File | null) => void;
}

export function CampoRegulamento({
    id,
    file,
    onChange,
}: CampoRegulamentoProps) {
    const [arrastando, setArrastando] = useState(false);

    function receber(arquivo: File | undefined) {
        if (arquivo?.type === "application/pdf") onChange(arquivo);
    }

    return (
        <label
            htmlFor={id}
            onDragOver={(evento) => {
                evento.preventDefault();
                setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(evento) => {
                evento.preventDefault();
                setArrastando(false);
                receber(evento.dataTransfer.files[0]);
            }}
            className={cn(
                "bg-muted focus-within:ring-ring/50 focus-within:border-ring flex h-16 cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 transition-colors focus-within:ring-[3px]",
                arrastando && "border-primary bg-accent",
            )}
        >
            <input
                id={id}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(evento) => receber(evento.target.files?.[0])}
            />

            <FilePdfIcon
                className="text-destructive shrink-0"
                size={24}
                weight="duotone"
            />

            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                    {file ? file.name : "Anexar regulamento"}
                </span>
                <span className="text-muted-foreground block text-xs">
                    {file ? "Clique para substituir" : "PDF de até 10 MB"}
                </span>
            </span>
        </label>
    );
}
