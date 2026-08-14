"use client";

import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react/dist/ssr/Image";

import { cn } from "@te-inscreve/components/utils";

interface CampoImagemProps {
    id: string;
    /** Descreve o campo para leitores de tela; o rótulo visível fica no `Field`. */
    label: string;
    previewUrl: string | null;
    onChange: (file: File | null) => void;
    formato: "circulo" | "retangulo";
    /** Como a imagem preenche o quadro: logo cabe inteira, cartaz preenche. */
    ajuste: "contain" | "cover";
    placeholder: string;
    className?: string;
}

export function CampoImagem({
    id,
    label,
    previewUrl,
    onChange,
    formato,
    ajuste,
    placeholder,
    className,
}: CampoImagemProps) {
    const [arrastando, setArrastando] = useState(false);

    function receber(file: File | undefined) {
        if (file?.type.startsWith("image/")) onChange(file);
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
                "bg-muted text-muted-foreground focus-within:ring-ring/50 focus-within:border-ring relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed transition-colors focus-within:ring-[3px]",
                formato === "circulo" ? "rounded-full" : "rounded-lg",
                arrastando && "border-primary bg-accent",
                className,
            )}
        >
            <input
                id={id}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label={label}
                className="sr-only"
                onChange={(evento) => receber(evento.target.files?.[0])}
            />

            {previewUrl ? (
                // Blob local, sem host remoto para o next/image otimizar.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={previewUrl}
                    alt={`Pré-visualização: ${label}`}
                    className={cn(
                        "size-full",
                        ajuste === "cover" ? "object-cover" : "object-contain",
                    )}
                />
            ) : (
                <span className="flex flex-col items-center gap-1 px-2 text-center">
                    <ImageIcon size={20} weight="duotone" />
                    <span className="text-xs leading-tight">{placeholder}</span>
                </span>
            )}
        </label>
    );
}
