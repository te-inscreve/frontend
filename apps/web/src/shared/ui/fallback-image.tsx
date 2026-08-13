"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageBrokenIcon } from "@phosphor-icons/react/dist/ssr";

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
                "bg-muted flex flex-col items-center justify-center gap-0.5",
                props.className,
            )}
        >
            <ImageBrokenIcon className="text-muted-foreground" size={56} />
            <p className="text-muted-foreground text-center text-xl font-bold">
                {fallbackMessage ?? "Sem Capa"}
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
