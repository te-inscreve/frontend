"use client";

import { useState } from "react";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";

import type { InputProps } from "@te-inscreve/components";
import {
    Button,
    Input,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@te-inscreve/components";

/**
 * Campo de senha com alternância de visibilidade.
 *
 * A visibilidade é estado de cada campo — o login tem um, o cadastro tem dois —
 * então cada instância controla o próprio olho.
 */
export function PasswordInput({ className, ...props }: InputProps) {
    const [visivel, setVisivel] = useState(false);
    const rotulo = visivel ? "Ocultar senha" : "Mostrar senha";

    return (
        <div className="relative">
            <Input
                {...props}
                type={visivel ? "text" : "password"}
                className={className ? `${className} pr-10` : "pr-10"}
            />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={rotulo}
                            aria-pressed={visivel}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0.5 -translate-y-1/2"
                            onClick={() => setVisivel((atual) => !atual)}
                        >
                            {visivel ? (
                                <EyeIcon aria-hidden="true" />
                            ) : (
                                <EyeSlashIcon aria-hidden="true" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                        {rotulo}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
