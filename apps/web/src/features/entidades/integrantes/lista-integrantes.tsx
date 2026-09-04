"use client";

import { Checkbox, Label } from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { LinhaIntegrante } from "./linha-integrante";

interface Props {
    integrantes: Integrante[];
    selecionados: number[];
    /** Com a seleção ligada as linhas marcam; sem ela, abrem o detalhe. */
    modoSelecao: boolean;
    onAlternar: (id: number) => void;
    onSelecionarTodos: (marcar: boolean) => void;
    /** Verdadeiro quando a lista está vazia por causa do filtro, não do cadastro. */
    filtrada: boolean;
    /** Nomes dos grupos montados nesta sessão, por id de integrante. */
    gruposDaSessaoPorIntegrante: Map<number, string[]>;
}

/**
 * A listagem de integrantes.
 *
 * Cada linha carrega o que decide uma inscrição: idade, matrícula e validade.
 * Clicar nela abre o detalhe da pessoa — a leitura é o que se faz aqui o tempo
 * todo. Marcar para montar um grupo é a tarefa rara, e por isso é um modo à
 * parte: só nele aparecem as caixas de seleção.
 */
export function ListaIntegrantes({
    integrantes,
    selecionados,
    modoSelecao,
    onAlternar,
    onSelecionarTodos,
    filtrada,
    gruposDaSessaoPorIntegrante,
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

    const todosMarcados = integrantes.every(({ id }) =>
        selecionados.includes(id),
    );

    return (
        <div className="bg-card overflow-hidden rounded-xl border">
            {modoSelecao && (
                <div className="bg-muted/40 flex items-center gap-3 border-b px-4 py-2.5">
                    <Checkbox
                        id="selecionar-todos"
                        checked={todosMarcados}
                        onCheckedChange={(marcado) =>
                            onSelecionarTodos(marcado === true)
                        }
                    />
                    <Label
                        htmlFor="selecionar-todos"
                        className="text-muted-foreground text-xs font-medium"
                    >
                        Selecionar todos os {integrantes.length} listados
                    </Label>
                </div>
            )}

            <ul className="divide-y">
                {integrantes.map((integrante) => (
                    <LinhaIntegrante
                        key={integrante.id}
                        integrante={integrante}
                        modoSelecao={modoSelecao}
                        marcado={selecionados.includes(integrante.id)}
                        onAlternar={onAlternar}
                        gruposDaSessao={
                            gruposDaSessaoPorIntegrante.get(integrante.id) ?? []
                        }
                    />
                ))}
            </ul>
        </div>
    );
}
