import type * as React from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@te-inscreve/components";

import type { CampoExibido } from "../editor-modelo-ficha/lib/campo-exibido";
import type {
    AgrupamentoPreenchido,
    CampoPreenchido,
    ItemPreenchido,
    ValorExibido,
} from "./lib/ficha-preenchida";
import {
    HorizontalScroll,
    HorizontalScrollNext,
    HorizontalScrollPrevious,
    HorizontalScrollViewport,
} from "~/shared/ui/horizontal-scroll";
import { SeloModificador } from "../ficha-avaliativa/folha-modelo-ficha";
import { PranchetaAnimada } from "./prancheta-animada";

type BlocoDaFolha =
    | { tipo: "campos"; campos: CampoPreenchido[] }
    | ({ tipo: "agrupamento" } & AgrupamentoPreenchido);

/**
 * A ficha avaliativa como o avaliador a entregou: a mesma prancheta da
 * {@link FolhaModeloFicha}, agora com a caneta. Os campos gerais trazem a
 * resposta no fim da linha pontilhada; cada agrupamento é a grade com uma
 * linha por ocorrência, com o nome que o avaliador deu a ela.
 *
 * Só desenha, já com os itens na ordem e os valores prontos para ler — quem
 * casa respostas e modelo é `fichaPreenchida`. O `cabecalho` fica no topo da
 * folha, o `fechamento` no pé dela, e o `rodape` na borda da prancheta.
 *
 * A prancheta é a {@link PranchetaAnimada}: a folha nasce do cartão da
 * ficha `fichaId` na bancada e volta para ele.
 */
export function FolhaAvaliacao({
    fichaId,
    cabecalho,
    itens,
    fechamento,
    rodape,
}: {
    fichaId: number;
    cabecalho: React.ReactNode;
    itens: ItemPreenchido[];
    /** O pé da folha, depois do último campo: quem avaliou, onde. */
    fechamento?: React.ReactNode;
    rodape?: React.ReactNode;
}) {
    const blocos = blocosDaFolha(itens);

    return (
        <article aria-labelledby="titulo-avaliacao" className="pt-2.5">
            <PranchetaAnimada
                fichaId={fichaId}
                entrar
                className="md:p-3"
                folhaClassName="gap-8 p-5 md:p-8"
                rodape={rodape}
            >
                {cabecalho}

                {itens.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                        A ficha desta avaliação não tem campos.
                    </p>
                )}

                {blocos.map((bloco) => {
                    if (bloco.tipo === "campos") {
                        const tituloId = `campos-gerais-${bloco.campos[0]?.chave}`;
                        return (
                            <section
                                key={tituloId}
                                aria-labelledby={tituloId}
                                className="flex flex-col gap-3"
                            >
                                <h2
                                    id={tituloId}
                                    className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
                                >
                                    Campos gerais
                                </h2>
                                <ul className="flex flex-col gap-4">
                                    {bloco.campos.map((campo) => (
                                        <LinhaCampo
                                            key={campo.chave}
                                            {...campo}
                                        />
                                    ))}
                                </ul>
                            </section>
                        );
                    }

                    const tituloId = `agrupamento-${bloco.chave}`;
                    return (
                        <section
                            key={tituloId}
                            aria-labelledby={tituloId}
                            className="flex flex-col gap-3"
                        >
                            <h2
                                id={tituloId}
                                className="bg-primary text-primary-foreground flex items-center gap-2 rounded-sm px-4 py-1 text-sm font-semibold"
                            >
                                <span className="truncate">{bloco.nome}</span>
                                <span className="ml-auto tabular-nums">
                                    <span className="sr-only">repete </span>×
                                    {bloco.ocorrencias.length}
                                </span>
                            </h2>
                            {bloco.campos.length > 0 ? (
                                <TabelaAgrupamento agrupamento={bloco} />
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Agrupamento sem campos.
                                </p>
                            )}
                        </section>
                    );
                })}

                {fechamento}
            </PranchetaAnimada>
        </article>
    );
}

/** Os campos gerais seguidos num bloco só; cada agrupamento, no seu. */
function blocosDaFolha(itens: ItemPreenchido[]): BlocoDaFolha[] {
    const blocos: BlocoDaFolha[] = [];
    for (const item of itens) {
        if (item.tipo === "agrupamento") {
            blocos.push(item);
            continue;
        }
        const ultimo = blocos.at(-1);
        if (ultimo?.tipo === "campos") ultimo.campos.push(item);
        else blocos.push({ tipo: "campos", campos: [item] });
    }
    return blocos;
}

/**
 * Um campo geral: o nome e o pontilhado até a resposta. Texto livre não cabe
 * na ponta da linha e desce para baixo dela, como uma anotação.
 */
function LinhaCampo({ campo, valor }: CampoPreenchido) {
    const textoLivre = valor.tipo === "texto";

    return (
        <li className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
                <span className="min-w-0 text-sm font-medium break-words">
                    {campo.nome}
                </span>
                {campo.modificadorNota && (
                    <span className="text-xs">
                        <SeloModificador modificador={campo.modificadorNota} />
                    </span>
                )}
                <span
                    aria-hidden="true"
                    className="border-foreground/15 mb-1 min-w-4 flex-1 border-b border-dotted"
                />
                {!textoLivre && (
                    <span className="shrink-0 text-right text-sm">
                        <Valor campo={campo} valor={valor} />
                    </span>
                )}
            </div>

            {textoLivre && (
                <p className="bg-muted/60 rounded-md px-3 py-2 text-sm whitespace-pre-line">
                    {valor.texto}
                </p>
            )}
        </li>
    );
}

/**
 * O agrupamento como a grade preenchida: uma coluna por campo, uma linha por
 * ocorrência, com o nome dado pelo avaliador, e o total da linha no fim. Quando os campos não cabem, a
 * grade rola de lado, como na folha do modelo.
 */
function TabelaAgrupamento({
    agrupamento,
}: {
    agrupamento: AgrupamentoPreenchido;
}) {
    return (
        <HorizontalScroll>
            <HorizontalScrollPrevious lateral />
            <HorizontalScrollNext lateral />
            <HorizontalScrollViewport
                label={`Respostas de ${agrupamento.nome}`}
                snap={false}
                className="-my-1 [&_[role=listitem]]:min-w-full"
            >
                <Table className="bg-card">
                    <caption className="sr-only">
                        Respostas de {agrupamento.nome}
                    </caption>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-muted-foreground min-w-32 align-bottom text-xs">
                                Ocorrência
                            </TableHead>
                            {agrupamento.campos.map(({ chave, campo }) => (
                                <TableHead
                                    key={chave}
                                    scope="col"
                                    title={campo.descricao || undefined}
                                    className="h-auto min-w-32 border-l px-3 py-2 align-bottom"
                                >
                                    <span className="flex flex-col items-start gap-1 text-sm leading-tight font-medium whitespace-normal">
                                        {campo.nome}
                                        {campo.modificadorNota && (
                                            <span className="text-xs font-normal">
                                                <SeloModificador
                                                    modificador={
                                                        campo.modificadorNota
                                                    }
                                                />
                                            </span>
                                        )}
                                    </span>
                                </TableHead>
                            ))}
                            {agrupamento.temTotal && (
                                <TableHead
                                    scope="col"
                                    title="Soma das notas menos os descontos da linha"
                                    className="bg-muted/60 h-auto border-l px-3 py-2 text-right align-bottom text-sm font-semibold"
                                >
                                    Total
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agrupamento.ocorrencias.map((ocorrencia) => (
                            <TableRow key={ocorrencia.ordem}>
                                <TableHead
                                    scope="row"
                                    className="h-auto py-2 align-top text-sm font-medium whitespace-normal"
                                >
                                    {ocorrencia.nome}
                                </TableHead>
                                {agrupamento.campos.map(
                                    ({ chave, campo }, indice) => (
                                        <TableCell
                                            key={chave}
                                            className="max-w-64 border-l px-3 align-top text-sm whitespace-normal"
                                        >
                                            <Valor
                                                campo={campo}
                                                valor={
                                                    ocorrencia.valores[
                                                        indice
                                                    ] ?? { tipo: "branco" }
                                                }
                                            />
                                        </TableCell>
                                    ),
                                )}
                                {agrupamento.temTotal && (
                                    <TableCell className="bg-muted/60 border-l px-3 text-right align-top text-sm">
                                        <Total total={ocorrencia.total} />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </HorizontalScrollViewport>
        </HorizontalScroll>
    );
}

/**
 * O total da linha, o mesmo que o avaliador vê no cartão da ocorrência no
 * app. Sem nenhuma nota dada, é um traço, e não zero.
 */
function Total({ total }: { total: string | null }) {
    if (total === null) {
        return (
            <span className="text-muted-foreground">
                <span aria-hidden="true">—</span>
                <span className="sr-only">sem notas</span>
            </span>
        );
    }
    return (
        <span className="font-bold whitespace-nowrap tabular-nums">
            {total}
        </span>
    );
}

/**
 * A resposta de um campo: a nota com o teto ao lado ("8,5 / 10"), as
 * alternativas marcadas, o texto. Em branco é um traço, que não se confunde
 * com zero.
 */
function Valor({ campo, valor }: { campo: CampoExibido; valor: ValorExibido }) {
    switch (valor.tipo) {
        case "branco":
            return (
                <span className="text-muted-foreground">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">em branco</span>
                </span>
            );
        case "numerico":
            return (
                <span className="whitespace-nowrap tabular-nums">
                    <span className="font-bold">{valor.valor}</span>
                    {campo.teto && (
                        <span className="text-muted-foreground font-normal">
                            {" "}
                            / {campo.teto}
                        </span>
                    )}
                </span>
            );
        case "texto":
            return <span className="whitespace-pre-line">{valor.texto}</span>;
        case "alternativas":
            return (
                <span className="font-medium">{valor.nomes.join(", ")}</span>
            );
    }
}
