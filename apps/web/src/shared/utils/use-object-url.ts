"use client";

import { useEffect, useMemo } from "react";

/**
 * URL para pré-visualizar um arquivo do formulário. Um `File` ainda por subir
 * vira um blob local; uma string já é a URL do arquivo salvo e passa direto.
 *
 * A URL do blob sai do próprio render — derivar em vez de guardar em estado
 * evita o render extra — e o efeito só existe para revogar a anterior a cada
 * troca, senão o blob fica retido até a página recarregar.
 */
export function useObjectUrl(file: File | string | null): string | null {
    const blobUrl = useMemo(
        () => (file instanceof File ? URL.createObjectURL(file) : null),
        [file],
    );

    useEffect(() => {
        if (!blobUrl) return;
        return () => URL.revokeObjectURL(blobUrl);
    }, [blobUrl]);

    return blobUrl ?? (typeof file === "string" ? file : null);
}
