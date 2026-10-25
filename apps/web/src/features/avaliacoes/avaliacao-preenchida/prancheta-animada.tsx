"use client";

import type * as React from "react";
import { motion } from "motion/react";

import { cn } from "@te-inscreve/components";

import { Prendedor } from "../ficha-avaliativa/cartao-modelo-ficha";

/** Os `layoutId` de uma ficha: o cartão e a folha aberta usam os mesmos. */
const layoutIds = (fichaId: number) => ({
    prancheta: `ficha-avaliacao-${fichaId}`,
    folha: `ficha-avaliacao-${fichaId}-folha`,
});

/**
 * A prancheta de uma ficha preenchida, igual no cartão da bancada e na folha
 * aberta — é por ser a mesma estrutura dos dois lados que uma vira a outra.
 *
 * O Motion anima duas caixas, a prancheta e a folha presa nela, cada uma com
 * o seu `layoutId`; o resto entra e sai. As armadilhas de `docs/animacoes.md`
 * valem aqui:
 *
 * - o raio vai em `style`, para o Motion contra-escalar as quinas;
 * - o conteúdo leva `layout="position"`: filho de caixa que muda de tamanho é
 *   escalado junto, e texto escalado estica. Assim ele fica no tamanho final,
 *   cortado pela folha (`overflow-hidden`), e só aparece em opacidade;
 * - o prendedor também é contra-escalado, pelo mesmo motivo;
 * - nenhuma `transition` de CSS sobre `transform` em nada daqui.
 *
 * `entrar` liga o esmaecido de entrada do conteúdo. Fica desligado na
 * primeira pintura: o HTML do servidor não pode nascer transparente.
 */
export function PranchetaAnimada({
    fichaId,
    entrar,
    className,
    folhaClassName,
    rodape,
    sobreposicao,
    children,
}: {
    fichaId: number;
    entrar: boolean;
    className?: string;
    folhaClassName?: string;
    rodape?: React.ReactNode;
    /** Por cima de tudo, fora do conteúdo: o botão esticado do cartão. */
    sobreposicao?: React.ReactNode;
    children: React.ReactNode;
}) {
    const ids = layoutIds(fichaId);
    const entrada = entrar ? { opacity: 0 } : false;

    return (
        <motion.div
            layoutId={ids.prancheta}
            style={{ borderRadius: 12 }}
            className={cn(
                "bg-muted/60 relative flex flex-col border p-2",
                className,
            )}
        >
            <motion.div
                layout="position"
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0"
            >
                <Prendedor />
            </motion.div>

            <motion.div
                layoutId={ids.folha}
                style={{ borderRadius: 6 }}
                className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden shadow-xs"
            >
                <motion.div
                    layout="position"
                    initial={entrada}
                    animate={{ opacity: 1 }}
                    transition={{ opacity: { duration: 0.2, delay: 0.08 } }}
                    className={cn(
                        "flex min-h-0 flex-1 flex-col",
                        folhaClassName,
                    )}
                >
                    {children}
                </motion.div>
            </motion.div>

            {rodape && (
                <motion.div
                    layout="position"
                    initial={entrada}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground flex gap-3 px-1 pt-1.5 text-xs"
                >
                    {rodape}
                </motion.div>
            )}

            {sobreposicao}
        </motion.div>
    );
}
