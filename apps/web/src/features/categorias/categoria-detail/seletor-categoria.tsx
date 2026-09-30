"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@te-inscreve/components";

import { useTRPC } from "~/shared/api/trpc/client";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    /** Nome da categoria atual, que o servidor já tem: o gatilho não espera a lista. */
    nome: string;
}

/**
 * O último degrau da trilha do detalhe da categoria: o nome dela, que abre
 * uma busca para pular direto para outra categoria da mesma modalidade.
 *
 * A lista só é buscada quando o popover abre — ou um pouco antes, quando o
 * ponteiro ou o foco chegam ao gatilho —, para a página não pagar por um
 * atalho que a maioria das visitas não usa.
 */
export function SeletorCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
    nome,
}: Props) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [aberto, setAberto] = useState(false);

    const opcoesCategorias = trpc.categoria.getAll.queryOptions({
        eventoId,
        modalidadeId,
    });
    const categorias = useQuery({ ...opcoesCategorias, enabled: aberto });

    const antecipar = () => void queryClient.prefetchQuery(opcoesCategorias);

    const irPara = (id: number) => {
        setAberto(false);
        if (id === categoriaId) return;
        router.push(
            `/admin/eventos/${eventoId}/categorias/${id}?modalidade=${modalidadeId}`,
        );
    };

    return (
        <Popover open={aberto} onOpenChange={setAberto}>
            <PopoverTrigger
                aria-current="page"
                onPointerEnter={antecipar}
                onFocus={antecipar}
                className="text-foreground hover:bg-accent focus-visible:ring-ring/50 -mx-1 inline-flex items-center gap-1 rounded-sm px-1 font-medium outline-none focus-visible:ring-[3px]"
            >
                {nome}
                <CaretDownIcon aria-hidden="true" className="size-3.5" />
                <span className="sr-only">: trocar de categoria</span>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-64 p-0">
                {/* Abre com o destaque na categoria atual, e não na primeira. */}
                <Command defaultValue={String(categoriaId)}>
                    <CommandInput placeholder="Buscar categoria…" />
                    <CommandList>
                        {categorias.isPending ? (
                            <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                                <CircleNotchIcon
                                    aria-hidden="true"
                                    className="animate-spin"
                                />
                                Carregando categorias…
                            </div>
                        ) : categorias.isError ? (
                            <p className="text-destructive py-6 text-center text-sm">
                                Não foi possível carregar as categorias.
                            </p>
                        ) : (
                            <>
                                <CommandEmpty>
                                    Nenhuma categoria encontrada.
                                </CommandEmpty>
                                <CommandGroup>
                                    {categorias.data.map((categoria) => (
                                        // O `value` é o id, e o nome vai em
                                        // `keywords`: duas categorias podem
                                        // ter o mesmo nome, e o cmdk usa o
                                        // `value` como chave.
                                        <CommandItem
                                            key={categoria.id}
                                            value={String(categoria.id)}
                                            keywords={[categoria.nome]}
                                            onSelect={() =>
                                                irPara(categoria.id)
                                            }
                                        >
                                            <span className="flex-1 truncate">
                                                {categoria.nome}
                                            </span>
                                            {categoria.id === categoriaId && (
                                                <CheckIcon aria-hidden="true" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
