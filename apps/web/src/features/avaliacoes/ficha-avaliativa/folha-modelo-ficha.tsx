import type * as React from "react";

import {
    Badge,
    cn,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@te-inscreve/components";
import { aceitaAlternativas } from "@te-inscreve/schemas";

import type { CampoExibido } from "../editor-modelo-ficha/lib/campo-exibido";
import {
    HorizontalScroll,
    HorizontalScrollNext,
    HorizontalScrollPrevious,
    HorizontalScrollViewport,
} from "~/shared/ui/horizontal-scroll";
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

/** Um item do topo da folha, na ordem: um campo geral ou um agrupamento. */
export type ItemDaFolha =
    | ({ tipo: "campo" } & CampoDaFolha)
    | ({ tipo: "agrupamento" } & AgrupamentoDaFolha);

type BlocoDaFolha =
    | { tipo: "campos"; campos: CampoDaFolha[] }
    | ({ tipo: "agrupamento" } & AgrupamentoDaFolha);

/**
 * O modelo de ficha como uma folha presa na prancheta, a mesma do cartão da
 * listagem, do tamanho da tela: os campos gerais como linhas a preencher, com
 * o tipo, a ajuda e o que cada um aceita, e cada agrupamento na faixa verde
 * com a grade em branco por baixo, uma linha por repetição. Campos gerais e
 * agrupamentos se intercalam: os campos seguidos formam um bloco só.
 *
 * Só desenha, já com os itens na ordem: o detalhe a monta a partir do
 * backend, e a prévia do editor a partir do formulário. O `rodape` fica fora
 * da folha, na borda da prancheta, como no cartão.
 */
export function FolhaModeloFicha({
    nome,
    itens,
    mensagemVazia,
    rodape,
}: {
    nome: string;
    itens: ItemDaFolha[];
    mensagemVazia: string;
    rodape?: React.ReactNode;
}) {
    const blocos = blocosDaFolha(itens);
    const totalCampos = itens.filter((item) => item.tipo === "campo").length;
    const totalAgrupamentos = itens.length - totalCampos;
    const vazia = itens.every(
        (item) => item.tipo === "agrupamento" && item.campos.length === 0,
    );

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
                            {resumo(totalCampos, totalAgrupamentos)}
                        </p>
                    </header>

                    {vazia && (
                        <p className="text-muted-foreground text-sm">
                            {mensagemVazia}
                        </p>
                    )}

                    {blocos.map((bloco) => {
                        if (bloco.tipo === "campos") {
                            const [primeiro] = bloco.campos;
                            const tituloId = `campos-gerais-${primeiro?.chave}`;
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
                                    <ListaCampos campos={bloco.campos} />
                                </section>
                            );
                        }

                        const agrupamento = bloco;
                        const tituloId = `agrupamento-${agrupamento.chave}`;
                        return (
                            <section
                                key={agrupamento.chave}
                                aria-labelledby={tituloId}
                                className="flex flex-col gap-3 rounded-sm"
                            >
                                <h2
                                    id={tituloId}
                                    className="bg-primary text-primary-foreground flex items-center gap-2 rounded-sm px-4 py-1 text-sm font-semibold"
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
                                    <TabelaAgrupamento
                                        agrupamento={agrupamento}
                                    />
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

/** Os campos gerais seguidos num bloco só; cada agrupamento, no seu. */
function blocosDaFolha(itens: ItemDaFolha[]): BlocoDaFolha[] {
    const blocos: BlocoDaFolha[] = [];
    for (const item of itens) {
        if (item.tipo === "agrupamento") {
            blocos.push(item);
            continue;
        }
        const ultimo = blocos.at(-1);
        const campo = { chave: item.chave, campo: item.campo };
        if (ultimo?.tipo === "campos") ultimo.campos.push(campo);
        else blocos.push({ tipo: "campos", campos: [campo] });
    }
    return blocos;
}

function resumo(campos: number, agrupamentos: number) {
    const partes = [
        `${campos} ${campos === 1 ? "campo geral" : "campos gerais"}`,
        `${agrupamentos} ${agrupamentos === 1 ? "agrupamento" : "agrupamentos"}`,
    ];
    return partes.join(" · ");
}

/**
 * O agrupamento como a grade que o avaliador vai preencher: uma coluna por
 * campo e uma linha por repetição, todas em branco. Quando os campos não
 * cabem na folha, a grade rola de lado, com as setas e o esmaecimento das
 * pontas indicando que continua.
 */
function TabelaAgrupamento({
    agrupamento,
}: {
    agrupamento: AgrupamentoDaFolha;
}) {
    const linhas = Array.from(
        { length: agrupamento.quantidade },
        (_, indice) => indice + 1,
    );

    return (
        <HorizontalScroll>
            <HorizontalScrollPrevious lateral />
            <HorizontalScrollNext lateral />
            {/* Um item só, mais largo que a faixa: sem encaixe, e esticado
                até a largura da faixa quando os campos são poucos. */}
            <HorizontalScrollViewport
                label={`Campos de ${agrupamento.nome}`}
                snap={false}
                className="-my-1 [&_[role=listitem]]:min-w-full"
            >
                <Table className="bg-card">
                    <caption className="sr-only">
                        {agrupamento.nome}, {agrupamento.quantidade}{" "}
                        {agrupamento.quantidade === 1 ? "linha" : "linhas"} em
                        branco
                    </caption>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-muted-foreground w-10 text-center align-bottom text-xs">
                                <span aria-hidden="true">#</span>
                                <span className="sr-only">Linha</span>
                            </TableHead>
                            {agrupamento.campos.map(({ chave, campo }) => (
                                <CabecalhoCampo key={chave} campo={campo} />
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {linhas.map((linha) => (
                            <TableRow key={linha}>
                                <TableHead
                                    scope="row"
                                    className="text-muted-foreground h-auto text-center text-xs tabular-nums"
                                >
                                    {linha}
                                </TableHead>
                                {agrupamento.campos.map(({ chave, campo }) => (
                                    <TableCell
                                        key={chave}
                                        className="border-l px-3"
                                    >
                                        <CelulaEmBranco campo={campo} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </HorizontalScrollViewport>
        </HorizontalScroll>
    );
}

/**
 * O campo no topo da coluna: o nome e, por baixo, o que ele aceita. A ajuda
 * vai no `title`, para não alargar a coluna.
 */
function CabecalhoCampo({ campo }: { campo: CampoExibido }) {
    return (
        <TableHead
            scope="col"
            title={campo.descricao || undefined}
            className="h-auto min-w-32 border-l px-3 py-2 align-bottom"
        >
            <div className="flex flex-col gap-1">
                <span className="text-sm leading-tight font-medium whitespace-normal">
                    {campo.nome}
                    {campo.obrigatorio && (
                        <span className="text-destructive ml-0.5">
                            <span aria-hidden="true">*</span>
                            <span className="sr-only">(obrigatório)</span>
                        </span>
                    )}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
                    {campo.tipo === "NUMERICO" ? (
                        <>
                            {campo.teto ? `0 - ${campo.teto}` : "Numérico"}
                            {campo.modificadorNota && (
                                <SeloModificador
                                    modificador={campo.modificadorNota}
                                />
                            )}
                        </>
                    ) : (
                        ROTULO_TIPO[campo.tipo]
                    )}
                </span>
            </div>
        </TableHead>
    );
}

/**
 * A célula ainda sem nota: zero nos campos numéricos, um traço nos demais,
 * que não têm zero.
 */
function CelulaEmBranco({ campo }: { campo: CampoExibido }) {
    if (campo.tipo === "NUMERICO") {
        return <NotaComTeto teto={campo.teto} />;
    }

    return (
        <span className="text-muted-foreground">
            <span aria-hidden="true">—</span>
            <span className="sr-only">em branco</span>
        </span>
    );
}

/**
 * A nota do campo numérico com o teto ao lado, como "0 / 10": o mesmo que o
 * avaliador vê no campo do app. Sem teto, só a nota.
 */
function NotaComTeto({
    teto,
    className,
}: {
    teto: string | null;
    className?: string;
}) {
    return (
        <span className={cn("whitespace-nowrap tabular-nums", className)}>
            <span className="font-bold">0</span>
            {teto && (
                <span className="text-muted-foreground font-normal">
                    {" "}
                    / {teto}
                </span>
            )}
        </span>
    );
}

function SeloModificador({
    modificador,
}: {
    modificador: NonNullable<CampoExibido["modificadorNota"]>;
}) {
    return (
        <span
            className={cn(
                "rounded-[4px] px-1.5 font-semibold",
                modificador === "DESCONTA"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-primary/15 text-primary",
            )}
        >
            {ROTULO_MODIFICADOR[modificador]}
        </span>
    );
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
        return (
            <>
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                    {campo.modificadorNota && (
                        <SeloModificador modificador={campo.modificadorNota} />
                    )}
                </p>
                <NotaComTeto teto={campo.teto} className="text-sm" />
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
    if (aceitaAlternativas(campo.tipo) && campo.alternativas.length) {
        return (
            <ul className="text-muted-foreground bg-muted flex w-fit flex-wrap gap-x-4 gap-y-1 rounded-md px-4 py-2 text-xs">
                {campo.alternativas.map((alternativa, indice) => (
                    <li key={indice} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className={cn(
                                "bg-card size-2.5 shrink-0 border",
                                campo.tipo === "ALTERNATIVA_MULTIPLA"
                                    ? "rounded-[2px]"
                                    : "rounded-full",
                            )}
                        />
                        {alternativa}
                    </li>
                ))}
            </ul>
        );
    }

    return null;
}
