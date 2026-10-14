"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

import { cn, FieldDescription } from "@te-inscreve/components";

import type { CampoExibido } from "./lib/campo-exibido";
import type {
    AgrupamentoForm,
    ModeloFichaFormValues,
} from "./lib/modelo-ficha-form-schema";
import {
    HorizontalScroll,
    HorizontalScrollNext,
    HorizontalScrollPrevious,
    HorizontalScrollViewport,
} from "~/shared/ui/horizontal-scroll";
import { ControleCampo, EntradaCampo, RotuloCampo } from "./controle-campo";
import { useEditor } from "./editor-contexto";
import { campoDaPosicao } from "./posicao-editavel";

/**
 * A ficha como o jurado a encontra: os campos gerais e cada agrupamento
 * repetido `quantidade` vezes, numa lista só. Os controles respondem, mas o
 * que se preenche aqui não é guardado.
 *
 * Os campos gerais ficam lado a lado e quebram de linha quando não cabem; a
 * observação ocupa duas colunas.
 * O agrupamento é uma tabela: o rótulo, o modificador e a ajuda de cada campo
 * aparecem uma vez no cabeçalho, e cada volta é uma linha só, aberta pelo
 * nome dela ("Danças 1"). Quando os campos não cabem, a tabela rola na
 * horizontal em vez de quebrar a linha.
 */
export function PreviaModeloFicha() {
    const { camposGlobais } = useEditor();
    const [nome, camposGerais, agrupamentos] = useWatch<
        ModeloFichaFormValues,
        ["nome", "camposGerais", "agrupamentos"]
    >({ name: ["nome", "camposGerais", "agrupamentos"] });

    const vazia =
        camposGerais.length === 0 &&
        agrupamentos.every((agrupamento) => agrupamento.campos.length === 0);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
                {nome.trim() || "Modelo sem nome"}
            </h1>

            {vazia && (
                <p className="text-muted-foreground text-sm">
                    A ficha ainda não tem campos. Volte à edição para montá-la.
                </p>
            )}

            {/* Os campos gerais lado a lado, quebrando quando não cabem. Grade
                com `auto-fill` em vez de `flex-wrap`: o campo que sobra numa
                linha nova mantém a largura dos de cima, em vez de esticar.

                A observação é texto livre e ocupa duas colunas — só quando a
                grade tem duas: ela é o próprio `@container`, e 29.5rem são
                duas colunas de 14rem mais o `gap-x-6`. Sem a consulta, o
                `span 2` numa grade de uma coluna criaria uma coluna implícita
                e estouraria a largura. */}
            {camposGerais.length > 0 && (
                <div className="@container grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] items-start gap-x-6 gap-y-5">
                    {camposGerais.map((posicao) => {
                        const campo = campoDaPosicao(posicao, camposGlobais);
                        return (
                            campo && (
                                <div
                                    key={posicao.chave}
                                    className={cn(
                                        campo.tipo === "OBSERVACAO" &&
                                            "@min-[29.5rem]:col-span-2",
                                    )}
                                >
                                    <ControleCampo
                                        campo={campo}
                                        id={`previa-${posicao.chave}`}
                                    />
                                </div>
                            )
                        );
                    })}
                </div>
            )}

            {agrupamentos.map((agrupamento, indice) => (
                <PreviaAgrupamento
                    key={agrupamento.chave}
                    agrupamento={agrupamento}
                    nome={
                        agrupamento.nome.trim() || `Agrupamento ${indice + 1}`
                    }
                />
            ))}
        </div>
    );
}

/** Largura de cada coluna de campo: cabe o rótulo com o selo e um controle. */
const COLUNA_CAMPO = "minmax(12rem, 16rem)";

function PreviaAgrupamento({
    agrupamento,
    nome,
}: {
    agrupamento: AgrupamentoForm;
    nome: string;
}) {
    const { camposGlobais } = useEditor();
    const { cantoRef, setas } = useSetasNoCabecalho();

    const campos = agrupamento.campos.flatMap((posicao) => {
        const campo = campoDaPosicao(posicao, camposGlobais);
        return campo ? [{ chave: posicao.chave, campo }] : [];
    });
    if (campos.length === 0) return null;

    const voltas = Math.max(agrupamento.quantidade, 1);
    const tituloId = `previa-${agrupamento.chave}`;

    return (
        <section aria-labelledby={tituloId} className="flex flex-col gap-3">
            <h2
                id={tituloId}
                className="text-primary-foreground bg-primary rounded-sm px-2 py-1 text-xs font-semibold tracking-wide uppercase"
            >
                {nome}
            </h2>

            {/* Um filho só, a tabela inteira: cabeçalho e linhas rolam juntos
                e as colunas continuam alinhadas. As bordas das linhas são das
                células, sem `gap-x`, para a linha seguir contínua. */}
            <HorizontalScroll>
                <HorizontalScrollPrevious lateral style={setas} />
                <HorizontalScrollNext lateral style={setas} />
                <HorizontalScrollViewport
                    label={`Campos de ${nome}`}
                    snap={false}
                >
                    <div
                        className="grid items-start"
                        style={{
                            gridTemplateColumns: `max-content repeat(${campos.length}, ${COLUNA_CAMPO})`,
                        }}
                    >
                        {/* O canto vazio estica até a altura da linha do
                            cabeçalho: é por ele que as setas se centram nela. */}
                        <div
                            ref={cantoRef}
                            aria-hidden="true"
                            className="self-stretch"
                        />
                        {campos.map(({ chave, campo }) => (
                            <CabecalhoCampo
                                key={chave}
                                campo={campo}
                                id={`previa-${chave}`}
                            />
                        ))}

                        {Array.from({ length: voltas }, (_, volta) => {
                            const linhaId = `${tituloId}-${volta}`;
                            return (
                                <Linha
                                    key={volta}
                                    id={linhaId}
                                    rotulo={`${nome} ${volta + 1}`}
                                >
                                    {campos.map(({ chave, campo }) => (
                                        <div
                                            key={chave}
                                            className="border-t py-3 pr-6"
                                        >
                                            <EntradaCampo
                                                campo={campo}
                                                id={`previa-${chave}-${volta}`}
                                                rotuladoPor={`previa-${chave}-rotulo ${linhaId}`}
                                                descritoPor={
                                                    campo.descricao
                                                        ? `previa-${chave}-descricao`
                                                        : undefined
                                                }
                                            />
                                        </div>
                                    ))}
                                </Linha>
                            );
                        })}
                    </div>
                </HorizontalScrollViewport>
            </HorizontalScroll>
        </section>
    );
}

/** O `py-1` da faixa rolável, que fica acima da primeira linha da tabela. */
const RESPIRO_VIEWPORT = 4;

/**
 * Centra as setas laterais na linha do cabeçalho, e não na tabela inteira:
 * é ali que se lê o nome dos campos que vão aparecer. A altura da linha muda
 * com os rótulos e as ajudas, então é medida. Até a medida chegar, as setas
 * ficam no meio, como em qualquer `lateral`.
 */
function useSetasNoCabecalho() {
    const [canto, cantoRef] = useState<HTMLDivElement | null>(null);
    const [altura, setAltura] = useState<number | null>(null);

    useEffect(() => {
        if (!canto) return;
        const observador = new ResizeObserver(([entrada]) => {
            if (entrada) setAltura(entrada.contentRect.height);
        });
        observador.observe(canto);
        return () => observador.disconnect();
    }, [canto]);

    const setas: React.CSSProperties | undefined =
        altura === null ? undefined : { top: RESPIRO_VIEWPORT + altura / 2 };

    return { cantoRef, setas };
}

/** Rótulo, selo e ajuda do campo, uma vez para todas as voltas. */
function CabecalhoCampo({ campo, id }: { campo: CampoExibido; id: string }) {
    return (
        <div className="flex flex-col gap-1.5 pr-6 pb-3">
            <RotuloCampo campo={campo} id={`${id}-rotulo`} />
            {campo.descricao && (
                <FieldDescription id={`${id}-descricao`}>
                    {campo.descricao}
                </FieldDescription>
            )}
        </div>
    );
}

/**
 * Uma volta do agrupamento. `contents` deixa as células na grade da tabela;
 * o nome abre a linha e entra no nome acessível de cada controle dela.
 */
function Linha({
    id,
    rotulo,
    children,
}: {
    id: string;
    rotulo: string;
    children: React.ReactNode;
}) {
    return (
        <div className="contents">
            <div className="border-t py-3 pr-6">
                <span
                    id={id}
                    className="flex h-10 items-center text-sm font-semibold whitespace-nowrap"
                >
                    {rotulo}
                </span>
            </div>
            {children}
        </div>
    );
}
