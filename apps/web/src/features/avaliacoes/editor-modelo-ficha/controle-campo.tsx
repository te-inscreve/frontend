"use client";

import { Badge, Input, Label, Textarea } from "@te-inscreve/components";

import type { CampoExibido } from "./lib/campo-exibido";
import { ROTULO_MODIFICADOR } from "./lib/campo-exibido";

interface Props {
    campo: CampoExibido;
    /** Único na página: a prévia repete o campo a cada volta do agrupamento. */
    id: string;
    /** No editor o controle é só a imagem do que o jurado vai preencher. */
    desabilitado?: boolean;
}

/**
 * O campo como o jurado o encontra na ficha: rótulo, descrição e o controle do
 * tipo. O que se digita aqui não vai a lugar nenhum — o editor desenha o
 * controle desabilitado e a prévia o deixa usar, sem guardar.
 */
export function ControleCampo({ campo, id, desabilitado = false }: Props) {
    const descricaoId = campo.descricao ? `${id}-descricao` : undefined;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {campo.tipo === "ALTERNATIVA_MULTIPLA" ? (
                    <span id={`${id}-rotulo`} className="text-sm font-semibold">
                        {campo.nome}
                        {campo.obrigatorio && <Obrigatorio />}
                    </span>
                ) : (
                    <Label htmlFor={id} className="font-semibold">
                        {campo.nome}
                        {campo.obrigatorio && <Obrigatorio />}
                    </Label>
                )}
                {campo.modificadorNota && (
                    <Badge
                        variant={
                            campo.modificadorNota === "DESCONTA"
                                ? "destructive"
                                : "primary-outline"
                        }
                    >
                        {ROTULO_MODIFICADOR[campo.modificadorNota]}
                    </Badge>
                )}
            </div>
            {campo.descricao && (
                <p id={descricaoId} className="text-muted-foreground text-sm">
                    {campo.descricao}
                </p>
            )}

            {campo.tipo === "NUMERICO" && (
                <div className="flex items-center gap-2">
                    <Input
                        id={id}
                        inputMode="decimal"
                        placeholder="0"
                        disabled={desabilitado}
                        aria-describedby={descricaoId}
                        className="bg-card h-10 w-28 tabular-nums"
                    />
                    {campo.teto && (
                        <span className="text-muted-foreground text-sm tabular-nums">
                            de {campo.teto}
                        </span>
                    )}
                </div>
            )}

            {/* Escolha única: o jurado marca uma alternativa só. Os radios
                nativos dividem o `name`, que já é único por volta do
                agrupamento na prévia. */}
            {campo.tipo === "ALTERNATIVA_MULTIPLA" && (
                <div
                    role="radiogroup"
                    aria-labelledby={`${id}-rotulo`}
                    aria-describedby={descricaoId}
                    className="flex flex-col gap-2"
                >
                    {campo.alternativas.map((alternativa, indice) => (
                        <div
                            key={indice}
                            className="flex items-center gap-2 text-sm"
                        >
                            <input
                                type="radio"
                                id={`${id}-${indice}`}
                                name={id}
                                value={indice}
                                disabled={desabilitado}
                                className="accent-primary size-4 shrink-0 disabled:cursor-not-allowed"
                            />
                            <Label
                                htmlFor={`${id}-${indice}`}
                                className="font-normal"
                            >
                                {alternativa}
                            </Label>
                        </div>
                    ))}
                </div>
            )}

            {campo.tipo === "DESCRITIVO" && (
                <Input
                    id={id}
                    disabled={desabilitado}
                    aria-describedby={descricaoId}
                    className="bg-card h-10"
                />
            )}

            {campo.tipo === "OBSERVACAO" && (
                <Textarea
                    id={id}
                    rows={3}
                    disabled={desabilitado}
                    aria-describedby={descricaoId}
                    className="bg-card"
                />
            )}
        </div>
    );
}

function Obrigatorio() {
    return (
        <>
            <span aria-hidden="true" className="text-destructive ml-0.5">
                *
            </span>
            <span className="sr-only"> (obrigatório)</span>
        </>
    );
}
