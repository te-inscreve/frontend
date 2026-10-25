"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { ShareNetwork } from "@phosphor-icons/react/dist/ssr/ShareNetwork";

import { Button } from "@te-inscreve/components";

/**
 * Compartilha a página atual. No celular abre a folha nativa — WhatsApp e cia.
 * montam a prévia a partir das meta tags —; sem ela, copia o link.
 */
export function BotaoCompartilhar({ titulo }: { titulo: string }) {
    const [copiado, setCopiado] = useState(false);

    async function compartilhar() {
        const url = window.location.href;

        if (typeof navigator.share === "function") {
            try {
                await navigator.share({ title: titulo, url });
                return;
            } catch (erro) {
                // Fechar a folha não é erro; qualquer outra falha cai na cópia.
                if (erro instanceof DOMException && erro.name === "AbortError")
                    return;
            }
        }

        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    return (
        <Button variant="ghost" onClick={() => void compartilhar()}>
            {copiado ? <Check aria-hidden /> : <ShareNetwork aria-hidden />}
            <span aria-live="polite">
                {copiado ? "Link copiado" : "Compartilhar"}
            </span>
        </Button>
    );
}
