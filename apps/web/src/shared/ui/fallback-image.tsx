"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageBrokenIcon } from "@phosphor-icons/react/dist/ssr";

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
        <div className="bg-muted flex h-full w-full items-center justify-center rounded-lg">
            <ImageBrokenIcon className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-center text-sm">
                {fallbackMessage ?? "Imagem não disponível"}
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
