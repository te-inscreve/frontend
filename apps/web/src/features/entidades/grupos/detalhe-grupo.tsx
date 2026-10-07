"use client";

import { useState } from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { AnimatePresence } from "motion/react";

import { Badge, Button } from "@te-inscreve/components";

import type { FormGrupo, GrupoDetalhe } from "./grupo";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    CartaoIntegranteAlternavel,
    LinhaAlternavel,
} from "~/features/entidades/integrantes/cartao-integrante-alternavel";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { LadoDaBancada } from "./bancada";
import { contagemIntegrantes, formatarDataCriacao } from "./grupo";
import { MenuGrupo } from "./menu-grupo";

interface Props {
    grupo: GrupoDetalhe;
    onEditar: (dados: FormGrupo) => Promise<void> | void;
    onExcluir: () => Promise<void> | void;
    onAlternarIntegrante: (integrante: Integrante) => void;
    /** Se a formação em cena difere da última salva — só então há o que salvar. */
    temMudancas: boolean;
    onSalvar: () => Promise<void> | void;
    className?: string;
}

/**
 * O grupo aberto: o balde da bancada, onde a formação se junta.
 *
 * É o lado de chegada do gesto da tela — quem sai da cesta de integrantes
 * aparece aqui, e quem sai daqui volta para lá. Por isso o detalhe não é um
 * modal nem outra rota: o trabalho depende de ver a entidade inteira ao lado do
 * grupo, e um modal cobriria justamente a metade de onde vem a gente.
 *
 * Tem a mesma moldura e a mesma altura da cesta ({@link LadoDaBancada}): as duas
 * mãos são um par, e a que recebe não vale mais do que a que fornece. Com a
 * superfície igual dos dois lados, o que marca a mudança de lado é o trajeto do
 * cartão e o sinal que ele troca — `+` na cesta, `−` aqui.
 *
 * A passagem é saída e entrada nas duas listas ({@link LinhaAlternavel}), e
 * não um cartão voando de um lado ao outro — ver
 * {@link CartaoIntegranteAlternavel}.
 *
 * A volta para a grade é um botão "Voltar" na página do grupo, e não daqui —
 * ver `grupos/[id]/page.tsx`. Ele não depende de nenhum dado desta bancada,
 * então pinta com a casca da página, antes de o grupo chegar.
 *
 * Salvar é o pé do painel: a mão que recebe termina no que fazer depois de
 * mexer nela.
 */
export function DetalheGrupo({
    grupo,
    onEditar,
    onExcluir,
    onAlternarIntegrante,
    temMudancas,
    onSalvar,
    className,
}: Props) {
    const [salvando, setSalvando] = useState(false);

    const salvar = async () => {
        setSalvando(true);
        try {
            await onSalvar();
        } finally {
            setSalvando(false);
        }
    };

    return (
        <LadoDaBancada
            titulo={grupo.nome}
            descricao={
                grupo.descricao || <span className="italic">Sem descrição</span>
            }
            acoes={
                <MenuGrupo
                    grupo={grupo}
                    onEditar={onEditar}
                    onExcluir={onExcluir}
                />
            }
            className={className}
        >
            <div className="flex shrink-0 flex-wrap items-center gap-2">
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

                <span className="text-muted-foreground ml-auto text-xs">
                    Criado em {formatarDataCriacao(grupo.dataCriacao)}
                </span>
            </div>

            {/* A formação é o conteúdo do painel, mas ainda assim tem título: é
                ele que dá nome à lista para quem navega por cabeçalhos, e o que
                separa a gente do grupo dos selos logo acima. */}
            <h3 className="shrink-0 border-t pt-3 text-sm font-semibold">
                Formação
            </h3>

            {/* A formação rola por dentro, e não com a página: as duas mãos têm
                a mesma altura, e é rolando separadas que elas continuam lado a
                lado. */}
            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                {grupo.integrantes.length === 0 ? (
                    // O vazio é a própria área de chegada, tracejada como uma
                    // vaga esperando conteúdo — e não um parágrafo avisando que
                    // não há nada. Quem lê já está de frente para a cesta que a
                    // preenche.
                    <div className="text-muted-foreground bg-card flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm">
                        <UsersThreeIcon
                            aria-hidden="true"
                            size={32}
                            className="opacity-60"
                        />
                        <p className="max-w-sm">
                            Nenhum integrante adicionado ainda. Clique em um
                            integrante para adicioná-lo ao grupo.
                        </p>
                    </div>
                ) : (
                    // Uma coluna até o `2xl`: o cartão carrega nome, matrícula,
                    // idade e o aviso de vencida, e em duas colunas antes disso
                    // o nome trunca e o resumo quebra em três linhas — esta
                    // metade da tela já divide espaço com a cesta de
                    // integrantes.
                    <div className="flex flex-col gap-2">
                        <p
                            aria-live="polite"
                            className="text-muted-foreground text-xs"
                        >
                            Listando{" "}
                            {contagemIntegrantes(grupo.integrantes.length)}
                        </p>
                        <ul className="grid gap-3 2xl:grid-cols-2">
                            <AnimatePresence initial={false} mode="popLayout">
                                {grupo.integrantes.map((integrante) => (
                                    <LinhaAlternavel key={integrante.id}>
                                        <CartaoIntegranteAlternavel
                                            integrante={integrante}
                                            acao="tirar"
                                            rotulo={`Tirar ${nomeCompleto(integrante)} do grupo ${grupo.nome}`}
                                            onAlternar={onAlternarIntegrante}
                                        />
                                    </LinhaAlternavel>
                                ))}
                            </AnimatePresence>
                        </ul>
                    </div>
                )}
            </div>

            {grupo.pendenciaCarteiraVencida && (
                <p className="text-muted-foreground shrink-0 text-xs">
                    Quem está com a matrícula vencida precisa renovar antes de o
                    grupo ser inscrito em um evento.
                </p>
            )}

            {/* Desligado enquanto não há o que salvar: incluir e tirar já
                aparecem na tela na hora, então um botão sempre aceso não diria
                se o que está em cena já foi guardado ou não. */}
            <Button
                type="button"
                className="shrink-0"
                disabled={!temMudancas || salvando}
                onClick={() => void salvar()}
            >
                {salvando ? (
                    <SpinnerGapIcon
                        aria-hidden="true"
                        className="animate-spin"
                    />
                ) : (
                    <FloppyDiskIcon aria-hidden="true" />
                )}
                {salvando ? "Salvando…" : "Salvar formação"}
            </Button>
        </LadoDaBancada>
    );
}
