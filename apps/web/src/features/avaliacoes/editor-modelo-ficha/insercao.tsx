"use client";

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
}

/**
 * O "+" entre duas posições: aparece com o ponteiro por perto ou com o foco do
 * teclado. Com uma opção só ele já cria; com mais, abre o menu.
 */
export function Insercao({ opcoes, descricao, sempreVisivel = false }: Props) {
    const [unica] = opcoes;
    if (!unica) return null;

    const botao = (
        <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="rounded-full"
            aria-label={
                opcoes.length === 1
                    ? `${unica.rotulo} ${descricao}`
                    : `Adicionar ${descricao}`
            }
            onClick={
                opcoes.length === 1
                    ? (evento) => {
                          evento.stopPropagation();
                          unica.aoEscolher();
                      }
                    : (evento) => evento.stopPropagation()
            }
        >
            <PlusIcon aria-hidden="true" weight="bold" />
        </Button>
    );

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            {botao}
                        </DropdownMenuTrigger>
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
                )}
            </div>
        </div>
    );
}
