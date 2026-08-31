"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@te-inscreve/components";

import { FormModalidadeRapida } from "~/features/modalidades/fast-add/form-modalidade-rapida";

interface Props {
    eventoId: number;
}

/**
 * Atalho para criar modalidade, desenhado como mais uma aba da lista — é o
 * próximo item da fila de modalidades, e não um botão avulso no cabeçalho.
 *
 * Não é um `TabsTrigger`: ele abre o cadastro rápido em vez de trocar o
 * painel, então não entra na semântica de abas do Radix — daí ser um botão de
 * verdade, distinto das abas sem sair da linha.
 */
export function TabCriarModalidade({ eventoId }: Props) {
    const [aberto, setAberto] = useState(false);

    return (
        <Popover open={aberto} onOpenChange={setAberto}>
            <PopoverTrigger className="text-muted-foreground hover:text-primary focus-visible:ring-ring/50 focus-visible:outline-ring relative inline-flex h-[calc(100%-1px)] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 [&_svg]:size-4 [&_svg]:shrink-0">
                <PlusIcon aria-hidden="true" />
                Criar modalidade
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80">
                {/* <PopoverHeader className="mb-3">
                    <PopoverTitle className="w-full text-base font-bold">
                        Criar modalidade
                    </PopoverTitle>
                </PopoverHeader> */}

                <FormModalidadeRapida
                    eventoId={eventoId}
                    onCriada={() => setAberto(false)}
                />
            </PopoverContent>
        </Popover>
    );
}
