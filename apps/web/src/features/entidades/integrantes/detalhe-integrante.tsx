"use client";

import Link from "next/link";
import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UserMinusIcon } from "@phosphor-icons/react/dist/ssr/UserMinus";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { Badge, Button } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import type { AoEditarIntegrante } from "./modal-integrante";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    inscricoesDoIntegrante,
    ROTULO_RESULTADO,
} from "~/features/entidades/shared/historico-integrante";
import {
    formatarDataISO,
    idadeEm,
    matriculaVencida,
    nomeCompleto,
} from "~/features/entidades/shared/integrantes";
import { DialogEditarIntegrante } from "./dialog-editar-integrante";
import { useDetalheIntegrante } from "./lib/use-detalhe-integrante";

interface Props extends AoEditarIntegrante {
    integrante: Integrante;
}

/**
 * O que se sabe sobre um integrante, em três blocos: a matrícula que decide se
 * ele pode ser inscrito, os grupos a que pertence e o que já disputou.
 *
 * O cadastro e os grupos vêm da API — os grupos pelo detalhe da pessoa, que
 * só é pedido com o modal aberto ({@link useDetalheIntegrante}); o histórico
 * ainda é mock (`shared/historico-integrante.ts`).
 *
 * A edição sai daqui, e não do cartão: é no detalhe que a pessoa confere o
 * que está errado antes de corrigir. Tirar de um grupo também: é aqui que se
 * vê de quais ela faz parte, e desfazer um vínculo não pede confirmação —
 * ninguém perde cadastro, e a tela de grupos põe de volta com um clique.
 *
 * Cada grupo também leva à própria página dele (`CaretRightIcon`) — a mesma
 * seta do cartão de grupo na grade, aqui em miniatura. É onde a formação
 * inteira se vê e se monta; este modal só diz de quais a pessoa faz parte.
 */
export function DetalheIntegrante({ integrante, onEditar }: Props) {
    const {
        grupos,
        carregandoGrupos,
        erroGrupos,
        removerDoGrupo,
        removendoDe,
        erroAoRemover,
    } = useDetalheIntegrante(integrante.id);
    const inscricoes = inscricoesDoIntegrante(integrante);
    const vencida = matriculaVencida(integrante);

    return (
        <div className="flex flex-col gap-5">
            <Secao
                icone={<IdentificationCardIcon />}
                titulo="Dados"
                acao={
                    <DialogEditarIntegrante
                        integrante={integrante}
                        onEditar={onEditar}
                    />
                }
            >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Dado
                        termo="Matrícula MTG"
                        valor={integrante.matriculaMtg}
                    />
                    <Dado
                        termo="Validade da matrícula"
                        valor={formatarDataISO(integrante.validade)}
                        alerta={vencida}
                    />
                    <Dado
                        termo="Nascimento"
                        valor={`${formatarDataISO(integrante.dataNascimento)} · ${idadeEm(integrante.dataNascimento)} anos`}
                    />
                </dl>

                {vencida && (
                    <p className="text-warning bg-warning/10 border-warning/40 flex items-start gap-2 rounded-lg border p-2.5 text-xs">
                        <WarningIcon
                            aria-hidden="true"
                            weight="fill"
                            className="text-warning mt-px shrink-0"
                        />
                        Com a matrícula vencida, esta pessoa não pode ser
                        inscrita em novas categorias até a renovação.
                    </p>
                )}
            </Secao>

            <Secao icone={<UsersFourIcon />} titulo="Grupos">
                {carregandoGrupos ? (
                    // Duas linhas com a altura do item de verdade: a seção
                    // não pula quando a resposta chega.
                    <ul className="flex flex-col gap-1.5" aria-busy="true">
                        <li className="bg-muted/40 flex items-center gap-2 rounded-lg px-3 py-2">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Skeleton className="h-3.5 w-2/5" />
                                <Skeleton className="h-3 w-3/5" />
                            </div>
                            <Skeleton className="size-8 shrink-0 rounded-md" />
                        </li>
                        <li className="bg-muted/40 flex items-center gap-2 rounded-lg px-3 py-2">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Skeleton className="h-3.5 w-1/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="size-8 shrink-0 rounded-md" />
                        </li>
                    </ul>
                ) : erroGrupos ? (
                    <Erro>{erroGrupos.message}</Erro>
                ) : grupos.length === 0 ? (
                    <Vazio>
                        Ainda não faz parte de nenhum grupo desta entidade.
                    </Vazio>
                ) : (
                    <ul className="flex flex-col gap-1.5">
                        {grupos.map((grupo) => {
                            const removendo = removendoDe === grupo.id;

                            return (
                                <li
                                    key={grupo.id}
                                    className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {grupo.nome}
                                        </p>
                                        {grupo.descricao && (
                                            <p className="text-muted-foreground truncate text-xs">
                                                {grupo.descricao}
                                            </p>
                                        )}
                                    </div>

                                    {/* Só ícones: o nome do grupo já diz de
                                        onde se sai e para onde se vai, e um
                                        rótulo repetiria a linha. O
                                        `aria-label` de cada um conta a frase
                                        inteira para quem não vê o ícone. */}
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            asChild
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                        >
                                            <Link
                                                href={`/admin/minha-entidade/grupos/${grupo.id}`}
                                                aria-label={`Ver o grupo ${grupo.nome}`}
                                                title="Ver grupo"
                                            >
                                                <CaretRightIcon aria-hidden="true" />
                                            </Link>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="hover:text-destructive"
                                            disabled={removendoDe !== null}
                                            aria-label={`Tirar ${nomeCompleto(integrante)} do grupo ${grupo.nome}`}
                                            title={`Tirar do grupo ${grupo.nome}`}
                                            onClick={() =>
                                                void removerDoGrupo(grupo.id)
                                            }
                                        >
                                            {removendo ? (
                                                <SpinnerGapIcon
                                                    aria-hidden="true"
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <UserMinusIcon aria-hidden="true" />
                                            )}
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {erroAoRemover && (
                    <Erro>
                        Não foi possível tirar do grupo. Tente de novo em
                        instantes.
                    </Erro>
                )}
            </Secao>

            <Secao icone={<TicketIcon />} titulo="Inscrições anteriores">
                {inscricoes.length === 0 ? (
                    <Vazio>
                        Nenhuma inscrição registrada em edições anteriores.
                    </Vazio>
                ) : (
                    <ul className="flex flex-col gap-1.5">
                        {inscricoes.map((inscricao) => (
                            <li
                                key={inscricao.id}
                                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                            >
                                <span
                                    aria-hidden="true"
                                    className="text-muted-foreground flex w-9 shrink-0 items-center gap-1 text-xs font-semibold tabular-nums"
                                >
                                    <CalendarBlankIcon className="shrink-0" />
                                    {inscricao.ano}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {inscricao.evento}
                                    </p>
                                    <p className="text-muted-foreground truncate text-xs">
                                        {inscricao.modalidade} ·{" "}
                                        {inscricao.categoria}
                                    </p>
                                </div>

                                <Badge
                                    variant={
                                        inscricao.resultado === "premiado"
                                            ? "default"
                                            : "secondary"
                                    }
                                    className="shrink-0"
                                >
                                    {inscricao.resultado === "premiado" && (
                                        <TrophyIcon
                                            aria-hidden="true"
                                            weight="fill"
                                        />
                                    )}
                                    {ROTULO_RESULTADO[inscricao.resultado]}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </Secao>
        </div>
    );
}

function Secao({
    icone,
    titulo,
    acao,
    children,
}: {
    icone: React.ReactNode;
    titulo: string;
    /** Botão à direita do título — a única ação que cabe numa seção. */
    acao?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase [&_svg]:size-4">
                    <span aria-hidden="true" className="flex">
                        {icone}
                    </span>
                    {titulo}
                </h3>
                {acao}
            </div>
            {children}
        </section>
    );
}

/**
 * O alerta é um ícone, e não uma cor no texto: `--warning-foreground` é a cor
 * *sobre* `bg-warning` sólido, e aqui não há esse fundo — aplicada ao valor
 * solto ela o deixava invisível nos dois temas. Ícone também atende o "não
 * depender apenas de cor" do DESIGN.md.
 */
function Dado({
    termo,
    valor,
    alerta = false,
}: {
    termo: string;
    valor: string;
    alerta?: boolean;
}) {
    return (
        <div className="min-w-0">
            <dt className="text-muted-foreground text-xs">{termo}</dt>
            <dd className="flex items-center gap-1 truncate text-sm font-medium">
                {alerta && (
                    <WarningIcon
                        aria-hidden="true"
                        weight="fill"
                        className="text-warning shrink-0"
                    />
                )}
                {valor}
            </dd>
        </div>
    );
}

function Erro({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-destructive flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs">
            <BugIcon aria-hidden="true" size={16} className="shrink-0" />
            {children}
        </p>
    );
}

function Vazio({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-xs">
            {children}
        </p>
    );
}
