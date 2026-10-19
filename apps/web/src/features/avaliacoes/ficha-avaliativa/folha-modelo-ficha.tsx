import type * as React from "react";

import { Badge, cn } from "@te-inscreve/components";

import type { CampoExibido } from "../editor-modelo-ficha/lib/campo-exibido";
import {
    ROTULO_MODIFICADOR,
    ROTULO_TIPO,
} from "../editor-modelo-ficha/lib/campo-exibido";
import { Prendedor } from "./cartao-modelo-ficha";

export interface CampoDaFolha {
    chave: string | number;
    campo: CampoExibido;
}

export interface AgrupamentoDaFolha {
    chave: string | number;
    nome: string;
    quantidade: number;
    campos: CampoDaFolha[];
}

/**
 * O modelo de ficha como uma folha presa na prancheta, a mesma do cartão da
 * listagem, do tamanho da tela: os campos gerais como linhas a preencher, com
 * o tipo, a ajuda e o que cada um aceita, e cada agrupamento na faixa verde
 * com as mesmas linhas por baixo.
 *
 * Só desenha, já com os campos na ordem: o detalhe a monta a partir do
 * backend, e a prévia do editor a partir do formulário. O `rodape` fica fora
 * da folha, na borda da prancheta, como no cartão.
 */
export function FolhaModeloFicha({
    nome,
    camposGerais,
    agrupamentos,
    mensagemVazia,
    rodape,
}: {
    nome: string;
    camposGerais: CampoDaFolha[];
    agrupamentos: AgrupamentoDaFolha[];
    mensagemVazia: string;
    rodape?: React.ReactNode;
}) {
    const vazia =
        camposGerais.length === 0 &&
        agrupamentos.every((agrupamento) => agrupamento.campos.length === 0);

    return (
        <article aria-labelledby="titulo-modelo-ficha" className="pt-2.5">
            <div className="bg-muted/60 relative flex min-h-[70vh] flex-col rounded-xl border p-2 md:p-3">
                <Prendedor />

                <div className="bg-card flex flex-1 flex-col gap-8 rounded-md p-5 shadow-xs md:p-8">
                    <header className="flex flex-col gap-2">
                        <h1
                            id="titulo-modelo-ficha"
                            className="text-2xl leading-tight font-bold tracking-tight md:text-3xl"
                        >
                            {nome}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {resumo(camposGerais.length, agrupamentos.length)}
                        </p>
                    </header>

                    {vazia && (
                        <p className="text-muted-foreground text-sm">
                            {mensagemVazia}
                        </p>
                    )}

                    {camposGerais.length > 0 && (
                        <section
                            aria-labelledby="campos-gerais"
                            className="flex flex-col gap-3"
                        >
                            <h2
                                id="campos-gerais"
                                className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
                            >
                                Campos gerais
                            </h2>
                            <ListaCampos campos={camposGerais} />
                        </section>
                    )}

                    {agrupamentos.map((agrupamento) => {
                        const tituloId = `agrupamento-${agrupamento.chave}`;
                        return (
                            <section
                                key={agrupamento.chave}
                                aria-labelledby={tituloId}
                                className="bg-primary-foreground flex flex-col gap-3 rounded-sm px-4 pb-4"
                            >
                                <h2
                                    id={tituloId}
                                    className="bg-primary text-primary-foreground -mx-4 flex items-center gap-2 rounded-sm px-4 py-1 text-sm font-semibold"
                                >
                                    <span className="truncate">
                                        {agrupamento.nome}
                                    </span>
                                    <span className="ml-auto tabular-nums">
                                        <span className="sr-only">repete </span>
                                        ×{agrupamento.quantidade}
                                    </span>
                                </h2>
                                {agrupamento.campos.length > 0 ? (
                                    <ListaCampos campos={agrupamento.campos} />
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Agrupamento sem campos.
                                    </p>
                                )}
                            </section>
                        );
                    })}
                </div>

                {rodape && (
                    <div className="text-muted-foreground flex gap-3 px-2 pt-2 text-xs">
                        {rodape}
                    </div>
                )}
            </div>
        </article>
    );
}

function resumo(campos: number, agrupamentos: number) {
    const partes = [
        `${campos} ${campos === 1 ? "campo geral" : "campos gerais"}`,
        `${agrupamentos} ${agrupamentos === 1 ? "agrupamento" : "agrupamentos"}`,
    ];
    return partes.join(" · ");
}

/**
 * Os campos como as linhas da folha do cartão, agora com tudo: nome e
 * pontilhado até o tipo, e por baixo a ajuda e o que o campo aceita.
 */
function ListaCampos({ campos }: { campos: CampoDaFolha[] }) {
    return (
        <ul className="flex flex-col gap-4">
            {campos.map(({ chave, campo }) => (
                <LinhaCampo key={chave} campo={campo} />
            ))}
        </ul>
    );
}

function LinhaCampo({ campo }: { campo: CampoExibido }) {
    return (
        <li className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
                <span className="min-w-0 text-sm font-medium break-words">
                    {campo.nome}
                    {campo.obrigatorio && (
                        <span className="text-destructive ml-0.5">
                            <span aria-hidden="true">*</span>
                            <span className="sr-only">(obrigatório)</span>
                        </span>
                    )}
                </span>
                {campo.teto ? (
                    <span className="text-muted-foreground text-xs">
                        (0 - {campo.teto})
                    </span>
                ) : null}
                <span
                    aria-hidden="true"
                    className="border-foreground/15 mb-1 min-w-4 flex-1 border-b border-dotted"
                />
                <BadgeTipoNumerico campo={campo} />
            </div>

            <DetalheTipoAlternativa campo={campo} />
            {campo.descricao && (
                <p className="text-muted-foreground text-xs">
                    {campo.descricao}
                </p>
            )}
        </li>
    );
}

/** O que só o tipo tem: o modificador e o teto da nota, as alternativas. */
function BadgeTipoNumerico({ campo }: { campo: CampoExibido }) {
    if (campo.tipo === "NUMERICO") {
        const desconta = campo.modificadorNota === "DESCONTA";
        return (
            <>
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                    {campo.modificadorNota && (
                        <span
                            className={cn(
                                "rounded-[4px] px-1.5 font-semibold",
                                desconta
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-primary/15 text-primary",
                            )}
                        >
                            {ROTULO_MODIFICADOR[campo.modificadorNota]}
                        </span>
                    )}
                </p>
                <span className="text-sm font-bold">0</span>
            </>
        );
    }

    return (
        <Badge variant="secondary" className="shrink-0">
            {ROTULO_TIPO[campo.tipo]}
        </Badge>
    );
}

function DetalheTipoAlternativa({ campo }: { campo: CampoExibido }) {
    if (campo.tipo === "ALTERNATIVA_MULTIPLA" && campo.alternativas.length) {
        return (
            <ul className="text-muted-foreground bg-muted flex w-fit flex-wrap gap-x-4 gap-y-1 rounded-md px-4 py-2 text-xs">
                {campo.alternativas.map((alternativa, indice) => (
                    <li key={indice} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="bg-card size-2.5 shrink-0 rounded-full border"
                        />
                        {alternativa}
                    </li>
                ))}
            </ul>
        );
    }

    return null;
}
