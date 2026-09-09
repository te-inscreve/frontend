"use client";

import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@te-inscreve/components";

import type { Visualizacao } from "./visualizacao";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { CartaoIntegrante } from "./cartao-integrante";
import { LinhaIntegrante } from "./linha-integrante";

interface Props {
    integrantes: Integrante[];
    visualizacao: Visualizacao;
    /** Verdadeiro quando a lista está vazia por causa do filtro, não do cadastro. */
    filtrada: boolean;
}

/**
 * A listagem de integrantes, em cartões ou em tabela.
 *
 * As duas visualizações mostram a mesma gente e abrem o mesmo detalhe; o que
 * muda é o que cabe na tela sem clicar. O cartão é para reconhecer alguém —
 * avatar e nome, poucos por vez; a tabela é para comparar todo mundo pelo mesmo
 * critério, e por isso é ela que ganha colunas.
 *
 * O vazio é decidido aqui, e não em cada visualização: a mensagem é a mesma nas
 * duas, e trocar de visualização com a lista vazia não deve mudar o que se lê.
 */
export function ListaIntegrantes({
    integrantes,
    visualizacao,
    filtrada,
}: Props) {
    if (integrantes.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                {filtrada
                    ? "Nenhum integrante corresponde ao filtro. Ajuste a busca ou limpe os filtros."
                    : "Nenhum integrante cadastrado. Cadastre as pessoas da entidade para poder inscrevê-las nas categorias de um evento."}
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
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
