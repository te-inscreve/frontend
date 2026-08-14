"use client";

import { useEffect, useMemo } from "react";

/**
 * URL temporária para pré-visualizar um arquivo que ainda não subiu. A URL sai
 * do próprio render — derivar em vez de guardar em estado evita o render extra
 * — e o efeito só existe para revogar a anterior a cada troca, senão o blob
 * fica retido até a página recarregar.
 */
export function useObjectUrl(file: File | null): string | null {
    const url = useMemo(
        () => (file ? URL.createObjectURL(file) : null),
        [file],
    );

    useEffect(() => {
        if (!url) return;
        return () => URL.revokeObjectURL(url);
    }, [url]);

    return url;
}
