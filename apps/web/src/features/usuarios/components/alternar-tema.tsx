"use client";

import { useId, useSyncExternalStore } from "react";
import { MoonIcon } from "@phosphor-icons/react/dist/ssr/Moon";
import { SunIcon } from "@phosphor-icons/react/dist/ssr/Sun";
import { useTheme } from "next-themes";

import { Field, FieldLabel, Switch } from "@te-inscreve/components";

const semInscricao = () => () => undefined;

/**
 * O interruptor entre o tema claro e o escuro.
 *
 * O tema mora no `localStorage`, que o servidor não enxerga: até montar, o
 * interruptor fica desabilitado e desligado, para o HTML do servidor e a
 * primeira pintura do cliente baterem. O `useSyncExternalStore` é o jeito de
 * saber "já montei" sem um `setState` dentro de efeito.
 */
export function AlternarTema() {
    const id = useId();
    const { resolvedTheme, setTheme } = useTheme();
    const montado = useSyncExternalStore(
        semInscricao,
        () => true,
        () => false,
    );
    const escuro = montado && resolvedTheme === "dark";

    return (
        <Field orientation="horizontal" className="justify-between">
            <FieldLabel htmlFor={id} className="flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className="bg-muted text-muted-foreground grid size-9 place-items-center rounded-lg"
                >
                    {escuro ? <MoonIcon size={18} /> : <SunIcon size={18} />}
                </span>
                <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Modo escuro</span>
                    <span className="text-muted-foreground text-xs font-normal">
                        {escuro
                            ? "Cores escuras, para ambientes com pouca luz."
                            : "Cores claras, o padrão do Te Inscreve."}
                    </span>
                </span>
            </FieldLabel>
            <Switch
                id={id}
                checked={escuro}
                disabled={!montado}
                onCheckedChange={(ligado) =>
                    setTheme(ligado ? "dark" : "light")
                }
            />
        </Field>
    );
}
