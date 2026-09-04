"use client";

import { useState } from "react";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import {
    Button,
    Field,
    FieldLabel,
    Input,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";

interface Props {
    selecionados: Integrante[];
    onLimpar: () => void;
    onCriarGrupo: (nome: string) => void;
}

/**
 * A ponte entre filtrar e montar um grupo.
 *
 * Mostra os nomes escolhidos: depois de trocar o filtro, quem está selecionado
 * pode não estar mais na lista, e a barra é o único lugar onde a seleção
 * inteira continua visível.
 *
 * Só é montada dentro do modo de seleção, e por isso vazia ela ainda diz o que
 * fazer em vez de sumir — quem acabou de entrar no modo precisa dessa frase.
 */
export function BarraSelecao({ selecionados, onLimpar, onCriarGrupo }: Props) {
    const [aberto, setAberto] = useState(false);
    const [nome, setNome] = useState("");

    if (selecionados.length === 0) {
        return (
            <p className="border-primary/30 bg-primary/5 text-muted-foreground rounded-xl border border-dashed p-3 text-sm">
                Marque as pessoas que vão formar o grupo. A lista continua
                filtrável — a seleção não se perde ao trocar o filtro.
            </p>
        );
    }

    const criar = () => {
        const nomeLimpo = nome.trim();
        if (!nomeLimpo) return;

        onCriarGrupo(nomeLimpo);
        setNome("");
        setAberto(false);
    };

    return (
        <div className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 rounded-xl border p-3">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                    {selecionados.length === 1
                        ? "1 integrante selecionado"
                        : `${selecionados.length} integrantes selecionados`}
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {selecionados.map((integrante) => (
                        <li
                            key={integrante.id}
                            className="bg-card rounded-full border px-2.5 py-1 text-xs"
                        >
                            {integrante.nome}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onLimpar}
                >
                    <XIcon aria-hidden="true" />
                    Limpar
                </Button>

                <Popover open={aberto} onOpenChange={setAberto}>
                    <PopoverTrigger asChild>
                        <Button type="button" size="sm">
                            <UsersFourIcon aria-hidden="true" />
                            Criar grupo
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent align="end" className="w-72">
                        <div className="flex flex-col gap-3">
                            <Field>
                                <FieldLabel htmlFor="nome-do-grupo">
                                    Nome do grupo
                                </FieldLabel>
                                <Input
                                    id="nome-do-grupo"
                                    autoFocus
                                    value={nome}
                                    onChange={(evento) =>
                                        setNome(evento.target.value)
                                    }
                                    onKeyDown={(evento) => {
                                        // Enter dentro de um popover não envia
                                        // nada — não há formulário aqui.
                                        if (evento.key === "Enter") {
                                            evento.preventDefault();
                                            criar();
                                        }
                                    }}
                                    placeholder="Ex.: Invernada Mirim"
                                    autoComplete="off"
                                />
                            </Field>

                            <p className="text-muted-foreground text-xs">
                                O grupo nasce com os {selecionados.length}{" "}
                                integrantes selecionados. Modalidade e
                                responsável são definidos depois.
                            </p>

                            <Button
                                type="button"
                                size="sm"
                                disabled={nome.trim() === ""}
                                onClick={criar}
                            >
                                Criar grupo
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
