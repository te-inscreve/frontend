"use client";

import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { Badge } from "@te-inscreve/components";

import type { FormGrupo, GrupoDetalhe } from "./grupo";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { CartaoIntegranteSelecao } from "./cartao-integrante-selecao";
import { contagemIntegrantes, formatarDataCriacao } from "./grupo";
import { MenuGrupo } from "./menu-grupo";
import { TrilhaGrupo } from "./trilha-grupo";

interface Props {
    grupo: GrupoDetalhe;
    onVoltar: () => void;
    onEditar: (dados: FormGrupo) => Promise<void> | void;
    onExcluir: () => void;
    onAlternarIntegrante: (integrante: Integrante) => void;
}

/**
 * O detalhe de um grupo, no lugar da grade e sem tocar na coluna da esquerda.
 *
 * É aqui que a formação se monta: a coluna entra em modo de seleção, e os dois
 * lados da tela passam a ser um par — quem sai de lá aparece aqui, e quem sai
 * daqui volta para lá. Por isso o detalhe não é um modal nem outra rota: o
 * trabalho depende de ver a entidade inteira ao lado do grupo.
 *
 * A viagem do cartão entre os dois lados não precisa de `AnimatePresence`: o
 * cartão não desaparece — ele é removido de uma lista e montado na outra no mesmo
 * render, e é o `layoutId` compartilhado que faz o Motion reconhecer os dois como
 * o mesmo elemento e animar o trajeto. Ver {@link CartaoIntegranteSelecao}.
 */
export function DetalheGrupo({
    grupo,
    onVoltar,
    onEditar,
    onExcluir,
    onAlternarIntegrante,
}: Props) {
    return (
        <section className="flex flex-col gap-4">
            <TrilhaGrupo nome={grupo.nome} onVoltar={onVoltar} />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <h2 className="text-xl font-bold tracking-tight">
                        {grupo.nome}
                    </h2>

                    {grupo.descricao ? (
                        <p className="text-muted-foreground max-w-prose text-sm">
                            {grupo.descricao}
                        </p>
                    ) : (
                        <p className="text-muted-foreground/70 text-sm italic">
                            Sem descrição
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <Badge variant="secondary">
                            <UsersThreeIcon aria-hidden="true" />
                            {contagemIntegrantes(grupo.totalIntegrantes)}
                        </Badge>

                        {grupo.pendenciaCarteiraVencida && (
                            <Badge variant="warning">
                                <WarningIcon
                                    aria-hidden="true"
                                    weight="fill"
                                    className="text-warning"
                                />
                                Matrícula vencida no grupo
                            </Badge>
                        )}

                        <span className="text-muted-foreground text-xs">
                            Criado em {formatarDataCriacao(grupo.dataCriacao)}
                        </span>
                    </div>
                </div>

                <MenuGrupo
                    grupo={grupo}
                    onEditar={onEditar}
                    onExcluir={onExcluir}
                />
            </div>

            <div className="flex flex-col gap-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Formação</h3>

                {grupo.integrantes.length === 0 ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                        O grupo ainda está vazio. Clique em alguém na lista de
                        integrantes, ao lado, para incluir no grupo — e clique
                        de novo, aqui, para tirar.
                    </p>
                ) : (
                    // Uma coluna até o `2xl`: o cartão carrega nome, matrícula,
                    // idade e o aviso de vencida, e em duas colunas antes disso
                    // o nome trunca e o resumo quebra em três linhas — esta
                    // metade da tela já divide espaço com a coluna de
                    // integrantes.
                    <ul className="grid gap-3 2xl:grid-cols-2">
                        {grupo.integrantes.map((integrante) => (
                            <CartaoIntegranteSelecao
                                key={integrante.id}
                                integrante={integrante}
                                estado="membro"
                                grupo={grupo.nome}
                                onAlternar={onAlternarIntegrante}
                            />
                        ))}
                    </ul>
                )}

                {grupo.pendenciaCarteiraVencida && (
                    <p className="text-muted-foreground text-xs">
                        Quem está com a matrícula vencida precisa renovar antes
                        de o grupo ser inscrito em um evento.
                    </p>
                )}
            </div>
        </section>
    );
}
