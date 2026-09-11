"use client";

import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { Badge } from "@te-inscreve/components";

import type { Grupo } from "./grupo";
import { contagemIntegrantes, formatarDataCriacao } from "./grupo";

/**
 * Um grupo como cartão da grade.
 *
 * O cartão inteiro abre o detalhe, e o detalhe é a mesma tela — não é um modal,
 * então aqui não há `ExpandableDialog`: a grade dá lugar ao grupo e a coluna de
 * integrantes continua onde está. É o que a tela precisa, porque o trabalho de
 * montar a formação é justamente olhar as duas coisas ao mesmo tempo.
 *
 * Mostra o que decide em qual grupo entrar: o nome, para que ele serve, o
 * tamanho da formação e o aviso de matrícula vencida, que é o que trava a
 * inscrição. A data de criação vai por último, miúda: serve para distinguir dois
 * grupos de nome parecido, e não para comparar grupos entre si.
 */
export function CartaoGrupo({
    grupo,
    onAbrir,
}: {
    grupo: Grupo;
    onAbrir: (id: number) => void;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={() => onAbrir(grupo.id)}
                className="bg-card hover:border-primary/50 hover:bg-muted/50 focus-visible:ring-ring/50 flex h-full w-full cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
                <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 text-base leading-tight font-bold">
                        {grupo.nome}
                    </h3>
                    <CaretRightIcon
                        aria-hidden="true"
                        className="text-muted-foreground mt-0.5 shrink-0"
                    />
                </div>

                {grupo.descricao ? (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                        {grupo.descricao}
                    </p>
                ) : (
                    <p className="text-muted-foreground/70 text-sm italic">
                        Sem descrição
                    </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                        <UsersThreeIcon aria-hidden="true" />
                        {contagemIntegrantes(grupo.totalIntegrantes)}
                    </Badge>

                    {grupo.pendenciaCarteiraVencida && (
                        <Badge
                            variant="warning"
                            title="Alguém do grupo está com a matrícula vencida e não pode ser inscrito."
                        >
                            <WarningIcon
                                aria-hidden="true"
                                weight="fill"
                                className="text-warning"
                            />
                            Matrícula vencida
                        </Badge>
                    )}

                    <span className="text-muted-foreground ml-auto text-xs">
                        {formatarDataCriacao(grupo.dataCriacao)}
                    </span>
                </div>
            </button>
        </li>
    );
}
