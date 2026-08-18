"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@te-inscreve/components/utils";

type ImageProps = React.ComponentProps<typeof Image>;

type FallbackImageProps = Omit<ImageProps, "src"> & {
    fallbackMessage?: string;
    src?: ImageProps["src"];
};

/**
 * Componente para exibir a imagem de uma planta.
 * Esse componente serve para desacoplar informações de planta em
 * serviços que não dependem do catálogo, como o jardim.
 */
export function FallbackImage({
    alt = "Imagem padrão de planta",
    src,
    fallbackMessage,
    onError,
    ...props
}: FallbackImageProps) {
    const [error, setError] = useState(false);
    const invalidImage = !src || error;

    return invalidImage ? (
        <div
            className={cn(
                "bg-muted relative flex flex-col items-center justify-center overflow-hidden border-b",
                props.className,
            )}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "radial-gradient(rgb(0 0 0 / 0.1) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                }}
            />

            <p className="text-muted-foreground relative z-10 text-center text-lg font-medium">
                {fallbackMessage ?? "Sem Cartaz"}
            </p>
        </div>
    ) : (
        <Image
            placeholder="blur"
            blurDataURL={"/assets/loading.png"}
            src={src}
            alt={alt}
            onError={(e) => {
                setError(true);
                onError?.(e);
            }}
            {...props}
        />
    );
}
