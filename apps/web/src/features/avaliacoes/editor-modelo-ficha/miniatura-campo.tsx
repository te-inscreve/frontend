import { cn } from "@te-inscreve/components/utils";
import { aceitaAlternativas } from "@te-inscreve/schemas";

import type { CampoExibido } from "./lib/campo-exibido";

/**
 * O controle do campo em escala de cartão: a caixa da nota com o teto, as
 * primeiras alternativas, a linha do texto curto, as pautas da observação.
 *
 * É desenho, não controle — `aria-hidden`, porque nome e tipo já estão
 * escritos ao lado.
 */
export function MiniaturaCampo({ campo }: { campo: CampoExibido }) {
    return (
        <div
            aria-hidden="true"
            className="bg-muted/50 flex h-16 items-center justify-center overflow-hidden rounded-sm border border-dashed px-3"
        >
            {campo.tipo === "NUMERICO" && <MiniaturaNumerico campo={campo} />}
            {aceitaAlternativas(campo.tipo) && (
                <MiniaturaAlternativas
                    alternativas={campo.alternativas}
                    multipla={campo.tipo === "ALTERNATIVA_MULTIPLA"}
                />
            )}
            {campo.tipo === "DESCRITIVO" && <MiniaturaDescritivo />}
            {campo.tipo === "OBSERVACAO" && <MiniaturaObservacao />}
        </div>
    );
}

function MiniaturaNumerico({ campo }: { campo: CampoExibido }) {
    const desconta = campo.modificadorNota === "DESCONTA";

    return (
        <div className="flex items-center gap-1.5">
            <span
                className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px] leading-none font-bold",
                    desconta
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary",
                )}
            >
                {desconta ? "−" : "+"}
            </span>
            <span className="bg-card text-muted-foreground flex h-7 w-11 items-center justify-center rounded-sm border text-xs tabular-nums">
                0
            </span>
            {campo.teto && (
                <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                    / {campo.teto}
                </span>
            )}
        </div>
    );
}

/** Rádio na única, caixa de seleção na múltipla — como o avaliador vai ver. */
function MiniaturaAlternativas({
    alternativas,
    multipla,
}: {
    alternativas: string[];
    multipla: boolean;
}) {
    const visiveis = alternativas.slice(0, 3);
    const linhas = visiveis.length > 0 ? visiveis : ["", ""];

    return (
        <ul className="flex w-full flex-col gap-1">
            {linhas.map((alternativa, indice) => (
                <li key={indice} className="flex items-center gap-1.5">
                    <span
                        className={cn(
                            "bg-card size-2.5 shrink-0 border",
                            multipla ? "rounded-[2px]" : "rounded-full",
                        )}
                    />
                    {alternativa ? (
                        <span className="text-muted-foreground truncate text-[10px] leading-none">
                            {alternativa}
                        </span>
                    ) : (
                        <span className="bg-muted-foreground/20 h-1.5 w-2/3 rounded-full" />
                    )}
                </li>
            ))}
        </ul>
    );
}

function MiniaturaDescritivo() {
    return (
        <div className="bg-card flex h-7 w-full items-center rounded-sm border px-2">
            <span className="bg-muted-foreground/20 h-1.5 w-1/2 rounded-full" />
        </div>
    );
}

function MiniaturaObservacao() {
    return (
        <div className="bg-card flex h-12 w-full flex-col justify-center gap-1.5 rounded-sm border px-2">
            <span className="bg-muted-foreground/20 h-1 w-full rounded-full" />
            <span className="bg-muted-foreground/20 h-1 w-full rounded-full" />
            <span className="bg-muted-foreground/20 h-1 w-1/2 rounded-full" />
        </div>
    );
}
