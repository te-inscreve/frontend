"use client";

import { CakeIcon } from "@phosphor-icons/react/dist/ssr/Cake";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { Badge, Checkbox, Label } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    formatarDataISO,
    idadeEm,
    matriculaVencida,
    rotuloFuncao,
} from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";

interface Props {
    integrantes: Integrante[];
    selecionados: number[];
    onAlternar: (id: number) => void;
    onSelecionarTodos: (marcar: boolean) => void;
    /** Verdadeiro quando a lista está vazia por causa do filtro, não do cadastro. */
    filtrada: boolean;
}

/**
 * A listagem de integrantes com seleção.
 *
 * Cada linha carrega o que decide uma inscrição: idade, matrícula e validade.
 * A caixa de seleção fica à esquerda porque a tarefa que a usa — montar um
 * grupo — é uma varredura de cima a baixo, e não a leitura de uma pessoa só.
 */
export function ListaIntegrantes({
    integrantes,
    selecionados,
    onAlternar,
    onSelecionarTodos,
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

    const todosMarcados = integrantes.every(({ id }) =>
        selecionados.includes(id),
    );

    return (
        <div className="bg-card overflow-hidden rounded-xl border">
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

            <ul className="divide-y">
                {integrantes.map((integrante) => {
                    const marcado = selecionados.includes(integrante.id);
                    const vencida = matriculaVencida(integrante);

                    return (
                        <li
                            key={integrante.id}
                            className={cn(
                                "flex flex-wrap items-center gap-3 p-3 transition-colors",
                                marcado && "bg-primary/5",
                            )}
                        >
                            <Checkbox
                                id={`integrante-${integrante.id}`}
                                checked={marcado}
                                onCheckedChange={() =>
                                    onAlternar(integrante.id)
                                }
                                aria-label={`Selecionar ${integrante.nome}`}
                            />

                            <AvatarUsuario
                                nome={integrante.nome}
                                size={36}
                                alt=""
                            />

                            <div className="min-w-0 flex-1">
                                <Label
                                    htmlFor={`integrante-${integrante.id}`}
                                    className="block truncate text-sm font-semibold"
                                >
                                    {integrante.nome}
                                </Label>
                                <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                    <span className="flex items-center gap-1">
                                        <IdentificationCardIcon aria-hidden="true" />
                                        {integrante.matriculaCtg}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CakeIcon aria-hidden="true" />
                                        {formatarDataISO(
                                            integrante.dataNascimento,
                                        )}
                                        {" · "}
                                        {idadeEm(
                                            integrante.dataNascimento,
                                        )}{" "}
                                        anos
                                    </span>
                                    {integrante.dataFiliacao && (
                                        <span>
                                            na entidade desde{" "}
                                            {integrante.dataFiliacao.slice(
                                                0,
                                                4,
                                            )}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {/* A validade só aparece quando é problema —
                                    matrícula vencida trava a inscrição. */}
                                {vencida && (
                                    <Badge
                                        variant="outline"
                                        className="border-warning/40 bg-warning/10 gap-1"
                                    >
                                        <WarningIcon
                                            aria-hidden="true"
                                            weight="fill"
                                            className="text-warning"
                                        />
                                        Matrícula vencida em{" "}
                                        {formatarDataISO(
                                            integrante.validadeMatricula,
                                        )}
                                    </Badge>
                                )}
                                {integrante.funcao ? (
                                    <Badge variant="secondary">
                                        {rotuloFuncao(integrante.funcao)}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-xs">
                                        Sem função
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
