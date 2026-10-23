"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { Controller, useForm } from "react-hook-form";

import {
    Badge,
    Button,
    cn,
    Command,
    CommandItem,
    CommandList,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Field,
    FieldLabel,
} from "@te-inscreve/components";
import { tipoCampoFichaSchema } from "@te-inscreve/schemas";

import type { FiltrosCatalogo } from "./lib/filtros-catalogo-schema";
import { ROTULO_TIPO } from "./lib/campo-exibido";
import {
    filtrosCatalogoSchema,
    filtrosCatalogoVazios,
} from "./lib/filtros-catalogo-schema";

interface Props {
    /** O prefixo dos ids do catálogo. */
    id: string;
    /** O recorte em uso, que o "Aplicar" substitui. */
    filtros: FiltrosCatalogo;
    aoAplicar: (filtros: FiltrosCatalogo) => void;
}

/** O valor do item "todos" no `Command`, que só aceita texto. */
const TODOS = "todos";

/**
 * Os filtros do catálogo de campos prontos, no desenho de
 * `DialogFiltrosGrupos`: o rascunho só substitui o recorte em uso no
 * "Aplicar".
 *
 * É um `Dialog` comum, e não o `ExpandableDialog` dos grupos: o gatilho mora
 * num painel lateral que rola e fica sobre o canvas, e o morph saía dele
 * deslocado e por baixo de camadas vizinhas.
 *
 * O tipo é escolhido numa lista do `Command`, sem campo de busca — são cinco
 * opções. Sem o input do `cmdk`, o foco fica no próprio `Command`, e é ele que
 * recebe as setas e o Enter.
 */
export function DialogFiltrosCatalogo({ id, filtros, aoAplicar }: Props) {
    const [aberto, setAberto] = useState(false);
    const rascunho = useForm<FiltrosCatalogo>({
        resolver: zodResolver(filtrosCatalogoSchema),
        defaultValues: filtrosCatalogoVazios,
    });

    const ativos = filtros.tipo ? 1 : 0;

    const abrir = (proximo: boolean) => {
        // O rascunho nasce do filtro em uso a cada abertura, para não guardar
        // escolhas abandonadas da última vez.
        if (proximo) rascunho.reset(filtros);
        setAberto(proximo);
    };

    const aplicar = (evento: FormEvent<HTMLFormElement>) => {
        // O modal vive num portal, mas o `submit` sobe pela árvore do React
        // até o formulário do editor, que envolve o catálogo: sem isso,
        // aplicar o filtro também tentaria criar o modelo.
        evento.stopPropagation();
        void rascunho.handleSubmit((valores) => {
            aoAplicar(valores);
            setAberto(false);
        })(evento);
    };

    return (
        <Dialog open={aberto} onOpenChange={abrir}>
            <div className="relative shrink-0">
                <DialogTrigger asChild>
                    <Button
                        size="icon"
                        aria-label={
                            ativos === 0 ? "Filtros" : "Filtros (1 ativo)"
                        }
                        className="size-9"
                    >
                        <FunnelIcon aria-hidden="true" weight="bold" />
                    </Button>
                </DialogTrigger>
                {ativos > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1.5 -right-1.5 aspect-square px-1.5"
                    >
                        {ativos}
                    </Badge>
                )}
            </div>

            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-primary flex items-center gap-2">
                        <FunnelIcon aria-hidden="true" weight="bold" />
                        Filtros
                    </DialogTitle>
                    <DialogDescription>
                        Recorte os campos prontos pelo tipo.
                    </DialogDescription>
                </DialogHeader>

                <form
                    noValidate
                    onSubmit={aplicar}
                    className="flex flex-col gap-5"
                >
                    <Controller
                        control={rascunho.control}
                        name="tipo"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel id={`${id}-filtro-tipo`}>
                                    Tipo do campo
                                </FieldLabel>
                                <Command
                                    ref={field.ref}
                                    defaultValue={field.value ?? TODOS}
                                    aria-invalid={fieldState.invalid}
                                    tabIndex={0}
                                    loop
                                    onBlur={field.onBlur}
                                    className="focus-visible:ring-ring/50 rounded-md border outline-none focus-visible:ring-[3px]"
                                >
                                    <CommandList
                                        aria-labelledby={`${id}-filtro-tipo`}
                                    >
                                        <OpcaoTipo
                                            valor={TODOS}
                                            rotulo="Todos os tipos"
                                            selecionado={field.value === null}
                                            aoEscolher={() =>
                                                field.onChange(null)
                                            }
                                        />
                                        {tipoCampoFichaSchema.options.map(
                                            (tipo) => (
                                                <OpcaoTipo
                                                    key={tipo}
                                                    valor={tipo}
                                                    rotulo={ROTULO_TIPO[tipo]}
                                                    selecionado={
                                                        field.value === tipo
                                                    }
                                                    aoEscolher={() =>
                                                        field.onChange(tipo)
                                                    }
                                                />
                                            ),
                                        )}
                                    </CommandList>
                                </Command>
                            </Field>
                        )}
                    />

                    <DialogFooter className="border-t pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                rascunho.reset(filtrosCatalogoVazios)
                            }
                        >
                            Limpar
                        </Button>
                        <Button type="submit">Aplicar filtros</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function OpcaoTipo({
    valor,
    rotulo,
    selecionado,
    aoEscolher,
}: {
    valor: string;
    rotulo: string;
    selecionado: boolean;
    aoEscolher: () => void;
}) {
    return (
        <CommandItem
            value={valor}
            // `aria-selected` é do `cmdk`, que marca o item em destaque; a
            // escolha feita vai em `aria-checked`.
            aria-checked={selecionado}
            onSelect={aoEscolher}
            className="m-1"
        >
            <CheckIcon
                aria-hidden="true"
                weight="bold"
                className={cn(
                    "text-primary",
                    selecionado ? "opacity-100" : "opacity-0",
                )}
            />
            {rotulo}
        </CommandItem>
    );
}
