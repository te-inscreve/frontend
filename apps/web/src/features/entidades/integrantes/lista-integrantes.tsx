"use client";

import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";

import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@te-inscreve/components";

import type { AoEditarIntegrante } from "./modal-integrante";
import type { Visualizacao } from "./visualizacao";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { CartaoIntegrante } from "./cartao-integrante";
import { GradeIntegrantesSkeleton } from "./cartao-integrante-skeleton";
import { LinhaIntegrante } from "./linha-integrante";

/** Quantos esqueletos ocupar a grade: duas linhas cheias no maior breakpoint. */
const ESQUELETOS = 6;

interface Props extends AoEditarIntegrante {
    integrantes: Integrante[];
    visualizacao: Visualizacao;
    /** Primeira página ainda no caminho. */
    carregando: boolean;
    /** A falha da primeira página; só a mensagem interessa aqui. */
    erro: { message: string } | null;
}

/**
 * A listagem de integrantes, em cartões ou em tabela.
 *
 * As duas visualizações mostram a mesma gente e abrem o mesmo detalhe; o que
 * muda é o que cabe na tela sem clicar. O cartão é para reconhecer alguém —
 * avatar e nome, poucos por vez; a tabela é para comparar todo mundo pelo mesmo
 * critério, e por isso é ela que ganha colunas.
 *
 * Carregar, falhar e vazio são decididos aqui, e não em cada visualização: a
 * mensagem é a mesma nas duas, e trocar de visualização não deve mudar o que
 * se lê. O esqueleto é sempre a grade, mesmo em tabela: a tela abre em cartões,
 * e é nesse estado que a primeira página chega.
 */
export function ListaIntegrantes({
    integrantes,
    visualizacao,
    carregando,
    erro,
    onEditar,
}: Props) {
    if (carregando) return <GradeIntegrantesSkeleton quantidade={ESQUELETOS} />;

    if (erro) {
        return (
            <p className="text-destructive flex items-center gap-2 rounded-xl border border-dashed p-6 text-sm">
                <BugIcon aria-hidden="true" size={18} />
                {erro.message}
            </p>
        );
    }

    if (integrantes.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                Nenhum integrante cadastrado. Cadastre as pessoas da entidade
                para poder inscrevê-las nas categorias de um evento.
            </p>
        );
    }

    if (visualizacao === "cartoes") {
        return (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {integrantes.map((integrante) => (
                    <CartaoIntegrante
                        key={integrante.id}
                        integrante={integrante}
                        onEditar={onEditar}
                    />
                ))}
            </ul>
        );
    }

    return (
        <div className="bg-card overflow-hidden rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="px-2">Nome</TableHead>
                        <TableHead>Matrícula MTG</TableHead>
                        <TableHead>Idade</TableHead>
                        <TableHead>Situação</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {integrantes.map((integrante) => (
                        <LinhaIntegrante
                            key={integrante.id}
                            integrante={integrante}
                            onEditar={onEditar}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
