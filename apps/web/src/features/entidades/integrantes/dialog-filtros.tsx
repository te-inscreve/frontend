"use client";

import { useState } from "react";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";

import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Field,
    FieldError,
    FieldLabel,
    Label,
    Switch,
} from "@te-inscreve/components";

import type { FiltrosIntegrantes } from "./filtros-integrantes";
import { NumberInput } from "~/shared/ui/number-input";
import { filtrosAvancadosAtivos } from "./filtros-integrantes";

interface Props {
    filtros: FiltrosIntegrantes;
    onChange: (filtros: FiltrosIntegrantes) => void;
}

/**
 * Os filtros que não cabem na barra: faixa de idade e matrícula vencida.
 *
 * O diálogo trabalha em rascunho e só devolve o filtro no "Aplicar". Filtrar a
 * cada clique não adiantaria nada aqui — a lista está atrás do overlay, e a
 * pessoa não veria o efeito enquanto escolhe.
 */
export function DialogFiltros({ filtros, onChange }: Props) {
    const [aberto, setAberto] = useState(false);
    const [rascunho, setRascunho] = useState(filtros);

    const ativos = filtrosAvancadosAtivos(filtros);

    /** Faixa de cabeça para baixo não devolveria ninguém: não deixa aplicar. */
    const intervaloInvertido =
        rascunho.idadeMinima !== null &&
        rascunho.idadeMaxima !== null &&
        rascunho.idadeMaxima < rascunho.idadeMinima;

    const abrir = (proximo: boolean) => {
        // O rascunho nasce do filtro em uso a cada abertura: assim o diálogo
        // não guarda escolhas que a pessoa abandonou da última vez.
        if (proximo) setRascunho(filtros);
        setAberto(proximo);
    };

    const aplicar = () => {
        onChange(rascunho);
        setAberto(false);
    };

    const limpar = () =>
        setRascunho({
            ...rascunho,
            idadeMinima: null,
            idadeMaxima: null,
            somenteVencidas: false,
        });

    return (
        <Dialog open={aberto} onOpenChange={abrir}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="h-10">
                    <FunnelIcon aria-hidden="true" />
                    Filtros
                    {ativos > 0 && (
                        <Badge variant="secondary" className="ml-1">
                            {ativos}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-primary flex items-center">
                        <FunnelIcon
                            aria-hidden="true"
                            className="mr-2"
                            weight="bold"
                        />
                        Filtros
                    </DialogTitle>
                    <DialogDescription>
                        Recorte a lista pela idade que define a categoria e pela
                        situação da matrícula.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                    {/* Nenhuma ponta limita a outra enquanto se digita: com
                        `min` amarrado à mínima, o primeiro dígito da máxima
                        já cai abaixo do limite e o campo se apaga sozinho —
                        digitar 40 depois de 20 era impossível. A inversão é
                        cobrada no fim, quando as duas já têm valor. */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field data-invalid={intervaloInvertido}>
                            <FieldLabel htmlFor="filtro-idade-minima">
                                Idade mínima
                            </FieldLabel>
                            <NumberInput
                                id="filtro-idade-minima"
                                value={rascunho.idadeMinima}
                                onChange={(valor) =>
                                    setRascunho({
                                        ...rascunho,
                                        idadeMinima: valor ?? null,
                                    })
                                }
                                min={0}
                                aria-invalid={intervaloInvertido}
                                aria-describedby={
                                    intervaloInvertido
                                        ? "filtro-idade-erro"
                                        : undefined
                                }
                                placeholder="Sem mínimo"
                            />
                        </Field>

                        <Field data-invalid={intervaloInvertido}>
                            <FieldLabel htmlFor="filtro-idade-maxima">
                                Idade máxima
                            </FieldLabel>
                            <NumberInput
                                id="filtro-idade-maxima"
                                value={rascunho.idadeMaxima}
                                onChange={(valor) =>
                                    setRascunho({
                                        ...rascunho,
                                        idadeMaxima: valor ?? null,
                                    })
                                }
                                min={0}
                                aria-invalid={intervaloInvertido}
                                aria-describedby={
                                    intervaloInvertido
                                        ? "filtro-idade-erro"
                                        : undefined
                                }
                                placeholder="Sem máximo"
                            />
                        </Field>
                    </div>

                    {intervaloInvertido && (
                        <FieldError
                            id="filtro-idade-erro"
                            className="-mt-3"
                            errors={[
                                {
                                    message:
                                        "A idade máxima precisa ser maior ou igual à mínima.",
                                },
                            ]}
                        />
                    )}

                    <div className="border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="filtro-vencidas"
                                checked={rascunho.somenteVencidas}
                                onCheckedChange={(marcado) =>
                                    setRascunho({
                                        ...rascunho,
                                        somenteVencidas: marcado,
                                    })
                                }
                            />
                            <Label htmlFor="filtro-vencidas">
                                Somente matrículas vencidas
                            </Label>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs">
                            Quem está com a matrícula vencida não pode ser
                            inscrito no evento — é a lista de quem precisa
                            renovar.
                        </p>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button type="button" variant="ghost" onClick={limpar}>
                        Limpar
                    </Button>
                    <Button
                        type="button"
                        onClick={aplicar}
                        disabled={intervaloInvertido}
                    >
                        Aplicar filtros
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
