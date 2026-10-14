"use client";

import type * as React from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

export interface OpcaoInsercao {
    rotulo: string;
    aoEscolher: () => void;
}

interface Props {
    opcoes: OpcaoInsercao[];
    /** Onde entra, para o leitor de tela: "depois de Dicção". */
    descricao: string;
    /** Na lista vazia o botão não espera o hover — é o único caminho. */
    sempreVisivel?: boolean;
    /**
     * Um cartão tracejado do tamanho dos campos, sempre à vista — o fim de uma
     * grade, onde não há "entre dois" para o "+" morar.
     */
    cartao?: boolean;
    /** No cartão: realça quando um campo do catálogo vai cair no fim. */
    recebendo?: boolean;
}

/**
 * O "+" entre duas posições: aparece com o ponteiro por perto ou com o foco do
 * teclado. Com uma opção só ele já cria; com mais, abre o menu. Em `cartao`,
 * é o cartão tracejado no fim de uma grade.
 */
export function Insercao({
    opcoes,
    descricao,
    sempreVisivel = false,
    cartao = false,
    recebendo = false,
}: Props) {
    const [unica] = opcoes;
    if (!unica) return null;

    const rotulo =
        opcoes.length === 1
            ? `${unica.rotulo} ${descricao}`
            : `Adicionar ${descricao}`;
    const aoClicar =
        opcoes.length === 1
            ? (evento: React.MouseEvent) => {
                  evento.stopPropagation();
                  unica.aoEscolher();
              }
            : (evento: React.MouseEvent) => evento.stopPropagation();

    const botao = cartao ? (
        <button
            type="button"
            aria-label={rotulo}
            onClick={aoClicar}
            className={cn(
                "text-muted-foreground hover:border-primary/50 hover:text-primary focus-visible:ring-ring/50 data-[state=open]:border-primary/50 data-[state=open]:text-primary flex h-full min-h-28 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs transition-colors outline-none focus-visible:ring-[3px]",
                recebendo && "border-primary bg-primary/5 text-primary",
            )}
        >
            <PlusIcon aria-hidden="true" weight="bold" className="size-4" />
            Adicionar
        </button>
    ) : (
        <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="rounded-full"
            aria-label={rotulo}
            onClick={aoClicar}
        >
            <PlusIcon aria-hidden="true" weight="bold" />
        </Button>
    );

    if (cartao) {
        return opcoes.length === 1 ? (
            botao
        ) : (
            <Menu opcoes={opcoes}>{botao}</Menu>
        );
    }

    return (
        <div
            className={cn(
                "group/insercao relative flex h-6 items-center justify-center",
                sempreVisivel && "h-10",
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "bg-primary/40 absolute inset-x-0 top-1/2 h-px opacity-0 transition-opacity group-focus-within/insercao:opacity-100 group-hover/insercao:opacity-100",
                    sempreVisivel && "hidden",
                )}
            />
            <div
                className={cn(
                    "relative opacity-0 transition-opacity group-focus-within/insercao:opacity-100 group-hover/insercao:opacity-100 has-[[data-state=open]]:opacity-100",
                    sempreVisivel && "opacity-100",
                )}
            >
                {opcoes.length === 1 ? (
                    botao
                ) : (
                    <Menu opcoes={opcoes}>{botao}</Menu>
                )}
            </div>
        </div>
    );
}

function Menu({
    opcoes,
    children,
}: {
    opcoes: OpcaoInsercao[];
    children: React.ReactElement;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent align="center">
                {opcoes.map((opcao) => (
                    <DropdownMenuItem
                        key={opcao.rotulo}
                        onSelect={opcao.aoEscolher}
                    >
                        {opcao.rotulo}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
