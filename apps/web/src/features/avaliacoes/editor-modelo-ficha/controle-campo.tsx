"use client";

import {
    Badge,
    Field,
    FieldDescription,
    FieldLabel,
    Input,
    Label,
    Textarea,
} from "@te-inscreve/components";

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
 * O campo como o jurado o encontra na ficha: rótulo, o controle do tipo e,
 * abaixo dele, a descrição como texto de ajuda. O que se digita aqui não vai a lugar nenhum — o editor desenha o
 * controle desabilitado e a prévia o deixa usar, sem guardar.
 *
 * O agrupamento na prévia separa as peças — rótulo e ajuda uma vez no
 * cabeçalho, um controle por volta —, por isso elas também são exportadas.
 */
export function ControleCampo({ campo, id, desabilitado = false }: Props) {
    const rotuloId = `${id}-rotulo`;
    const descricaoId = campo.descricao ? `${id}-descricao` : undefined;

    return (
        <Field>
            <RotuloCampo campo={campo} id={rotuloId} controle={id} />
            <EntradaCampo
                campo={campo}
                id={id}
                rotuladoPor={rotuloId}
                descritoPor={descricaoId}
                desabilitado={desabilitado}
            />
            {campo.descricao && (
                <FieldDescription id={descricaoId}>
                    {campo.descricao}
                </FieldDescription>
            )}
        </Field>
    );
}

/**
 * Nome, obrigatoriedade e modificador. Com `controle`, o nome é o `label` do
 * controle; sem ele — o cabeçalho de um agrupamento, que nomeia vários —, é
 * texto, e cada controle aponta para ele por `aria-labelledby`.
 */
export function RotuloCampo({
    campo,
    id,
    controle,
}: {
    campo: CampoExibido;
    id: string;
    controle?: string;
}) {
    const conteudo = (
        <>
            {campo.nome}
            {campo.obrigatorio && <Obrigatorio />}
        </>
    );

    return (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {controle && campo.tipo !== "ALTERNATIVA_MULTIPLA" ? (
                <FieldLabel
                    id={id}
                    htmlFor={controle}
                    className="font-semibold"
                >
                    {conteudo}
                </FieldLabel>
            ) : (
                <span id={id} className="text-sm leading-none font-semibold">
                    {conteudo}
                </span>
            )}
            {campo.modificadorNota && (
                <Badge
                    variant={
                        campo.modificadorNota === "DESCONTA"
                            ? "destructive"
                            : "default"
                    }
                >
                    {ROTULO_MODIFICADOR[campo.modificadorNota]}
                </Badge>
            )}
        </div>
    );
}

/** Só o controle do tipo, nomeado e descrito por ids de fora. */
export function EntradaCampo({
    campo,
    id,
    rotuladoPor,
    descritoPor,
    desabilitado = false,
}: {
    campo: CampoExibido;
    id: string;
    /** Ids separados por espaço, como em `aria-labelledby`. */
    rotuladoPor: string;
    descritoPor?: string;
    desabilitado?: boolean;
}) {
    if (campo.tipo === "NUMERICO") {
        return (
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    inputMode="decimal"
                    placeholder="0"
                    disabled={desabilitado}
                    aria-labelledby={rotuladoPor}
                    aria-describedby={descritoPor}
                    className="bg-card h-10 w-28 tabular-nums"
                />
                {campo.teto && (
                    <span className="text-muted-foreground text-sm tabular-nums">
                        de {campo.teto}
                    </span>
                )}
            </div>
        );
    }

    // Escolha única: o jurado marca uma alternativa só. Os radios nativos
    // dividem o `name`, que já é único por volta do agrupamento na prévia.
    if (campo.tipo === "ALTERNATIVA_MULTIPLA") {
        return (
            <div
                role="radiogroup"
                aria-labelledby={rotuladoPor}
                aria-describedby={descritoPor}
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
        );
    }

    if (campo.tipo === "DESCRITIVO") {
        return (
            <Input
                id={id}
                disabled={desabilitado}
                aria-labelledby={rotuladoPor}
                aria-describedby={descritoPor}
                className="bg-card h-10"
            />
        );
    }

    return (
        <Textarea
            id={id}
            rows={3}
            disabled={desabilitado}
            aria-labelledby={rotuladoPor}
            aria-describedby={descritoPor}
            className="bg-card"
        />
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
