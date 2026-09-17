"use client";

import { useId } from "react";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { AnimatePresence, motion } from "motion/react";

import type { Categoria, ModalidadeDetalhe } from "@te-inscreve/schemas";
import { Button, cn, EXPANSION_TRANSITION } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import type {
    LinhaDoTicket,
    PayloadInscricao,
    SelecaoInscricao,
} from "./selecao-inscricao";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { contagemIntegrantes } from "~/features/entidades/grupos/grupo";
import { CartaoIntegranteSkeleton } from "~/features/entidades/integrantes/cartao-integrante-skeleton";
import { CartaoIntegranteInscricao } from "./cartao-integrante-inscricao";

/** Quantos esqueletos no máximo enquanto a formação do grupo não chega. */
const MAXIMO_DE_ESQUELETOS = 6;

interface Props {
    /** `null` enquanto a categoria não chega — o título vira reticências. */
    categoria: Categoria | null;
    /** `null` enquanto a modalidade não chega — os limites viram esqueleto. */
    modalidade: ModalidadeDetalhe | null;
    selecao: SelecaoInscricao;
    linhas: LinhaDoTicket[];
    /** Há grupo escolhido e `grupo.getById` ainda não respondeu. */
    carregandoGrupo: boolean;
    onAlternarIntegrante: (integrante: Integrante) => void;
    onCriar: () => void;
    /** O último payload enviado (mock) — para a tela acusar o clique. */
    ultimoEnvio: PayloadInscricao | null;
    className?: string;
}

/**
 * O lado direito da bancada de inscrição: quem se apresenta, em forma de
 * bilhete.
 *
 * É irmão da {@link LadoDaBancada} — mesma casca (`section` rotulada,
 * `bg-muted/40`, borda, raio), mesma altura, para os dois lados se lerem como
 * um par — mas com a forma de um ticket: três superfícies (cabeçalho, corpo,
 * rodapé) separadas por dois picotes. O cabeçalho diz *em que* se inscreve
 * (a categoria, e o grupo se houver); o corpo é a lista de quem vai; o rodapé
 * traz o que a categoria exige e o botão de criar. A forma não é enfeite: a
 * inscrição é o comprovante de que a entidade entra na categoria, e um
 * bilhete é o que a pessoa vai levar dali.
 *
 * O corpo rola por dentro, como as listas do outro lado: as duas mãos têm a
 * mesma altura, e é rolando separadas que continuam lado a lado.
 *
 * As linhas entram e saem com `AnimatePresence` + `motion.li layout` (o
 * padrão de `grade-grupos.tsx`), e não com `layoutId` compartilhado com a
 * lista da esquerda: a pessoa continua lá, marcada, enquanto aparece aqui —
 * ver {@link CartaoIntegranteInscricao}.
 *
 * Enquanto `grupo.getById` carrega, o corpo mostra esqueletos no lugar da
 * formação — tantos quantos o cartão do grupo disse que são, para a lista
 * não pular quando os nomes chegarem — e as linhas avulsas já marcadas
 * ficam embaixo, onde vão continuar.
 */
export function TicketInscricao({
    categoria,
    modalidade,
    selecao,
    linhas,
    carregandoGrupo,
    onAlternarIntegrante,
    onCriar,
    ultimoEnvio,
    className,
}: Props) {
    const tituloId = useId();
    const esqueletos = selecao.grupo
        ? Math.min(
              Math.max(selecao.grupo.totalIntegrantes, 1),
              MAXIMO_DE_ESQUELETOS,
          )
        : 0;

    return (
        <section
            aria-labelledby={tituloId}
            className={cn(
                // Sem `overflow-hidden`: os picotes saem 1,5px para fora da
                // borda para cobri-la, e um recorte os cortaria.
                "bg-muted/40 flex min-w-0 flex-col rounded-xl border",
                className,
            )}
        >
            <header className="bg-card flex shrink-0 flex-col gap-0.5 rounded-t-xl px-4 py-3">
                <h2
                    id={tituloId}
                    className="truncate text-lg font-bold tracking-tight"
                >
                    {modalidade === null || categoria === null
                        ? "…"
                        : `${modalidade.nome} ${categoria.nome.toLowerCase()}`}
                </h2>
                {selecao.grupo && (
                    <p className="text-muted-foreground text-sm italic">
                        Grupo selecionado:{" "}
                        <span className="text-foreground">
                            {selecao.grupo.nome}
                        </span>
                    </p>
                )}
            </header>

            <RecorteDoTicket />

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {linhas.length === 0 && !carregandoGrupo ? (
                    // O vazio é a própria área de chegada, tracejada como uma
                    // vaga esperando conteúdo — o mesmo desenho do grupo vazio
                    // na bancada de grupo.
                    <div className="bg-card flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm">
                        <UsersThreeIcon
                            aria-hidden="true"
                            size={32}
                            className="opacity-60"
                        />
                        <p className="text-muted-foreground max-w-sm">
                            Nenhum integrante adicionado ainda. Clique em um
                            grupo ou em um integrante para adicioná-lo à
                            inscrição.
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-3">
                        {carregandoGrupo &&
                            Array.from({ length: esqueletos }, (_, indice) => (
                                <CartaoIntegranteSkeleton key={`s-${indice}`} />
                            ))}

                        {/* `initial={false}`: o que já está no ticket na
                            primeira pintura não nasce animando. `popLayout`
                            tira a linha que sai do fluxo na hora, para as
                            vizinhas deslizarem sem esperar. */}
                        <AnimatePresence initial={false} mode="popLayout">
                            {linhas.map(({ integrante, origem }) => (
                                <motion.li
                                    key={integrante.id}
                                    // `min-w-0`: item de grade nasce com
                                    // `min-width: auto` e não encolhe abaixo
                                    // do conteúdo — em tela estreita o nome
                                    // empurrava o ícone para fora do bilhete.
                                    className="min-w-0"
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={EXPANSION_TRANSITION}
                                >
                                    <CartaoIntegranteInscricao
                                        integrante={integrante}
                                        lado="ticket"
                                        origem={origem}
                                        onAlternar={onAlternarIntegrante}
                                    />
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </div>

            <RecorteDoTicket />

            <footer className="bg-card flex shrink-0 flex-col gap-3 rounded-b-xl px-4 py-3">
                <RestricoesDaCategoria
                    categoria={categoria}
                    modalidade={modalidade}
                />

                <p aria-live="polite" className="text-muted-foreground text-xs">
                    {contagemIntegrantes(linhas.length)} na inscrição
                    {ultimoEnvio &&
                        " · o envio ainda não está ligado ao servidor; o payload foi registrado no console."}
                </p>

                <Button type="button" onClick={onCriar}>
                    <TicketIcon aria-hidden="true" />
                    Criar inscrição
                </Button>
            </footer>
        </section>
    );
}

/**
 * O que a categoria exige de quem se inscreve: a faixa de idade, e — na
 * modalidade em grupo — quantos por grupo.
 *
 * A linha "Por grupo" só aparece quando a modalidade é em grupo: fora dela
 * os dois limites são nulos por definição, e "mín. Sem limite · máx. Sem
 * limite" diria nada. Dentro dela, `null` é "Sem limite" — o organizador
 * pode fixar só uma das pontas.
 *
 * Esqueletos enquanto categoria e modalidade não chegam: as duas leituras
 * são hidratadas do `prefetch` da página, então na prática só piscam na
 * primeira visita.
 */
function RestricoesDaCategoria({
    categoria,
    modalidade,
}: Pick<Props, "categoria" | "modalidade">) {
    const semLimite = (valor: number | null) =>
        valor === null ? "Sem limite" : String(valor);

    return (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex gap-1">
                <dt className="text-muted-foreground">Idade:</dt>
                <dd className="font-semibold">
                    {categoria ? (
                        `${categoria.idadeMinima} a ${categoria.idadeMaxima} anos`
                    ) : (
                        <Skeleton className="h-3.5 w-20" />
                    )}
                </dd>
            </div>

            {modalidade === null ? (
                <div className="flex gap-1">
                    <dt className="text-muted-foreground">Por grupo:</dt>
                    <dd>
                        <Skeleton className="h-3.5 w-28" />
                    </dd>
                </div>
            ) : (
                modalidade.isGrupo && (
                    <div className="flex gap-1">
                        <dt className="text-muted-foreground">Por grupo:</dt>
                        <dd className="font-semibold">
                            mín. {semLimite(modalidade.minInscritosPorGrupo)} ·
                            máx. {semLimite(modalidade.maxInscritosPorGrupo)}
                        </dd>
                    </div>
                )
            )}
        </dl>
    );
}

/**
 * O {@link TicketInscricao} enquanto o portão da entidade não decide: a mesma
 * geometria — cabeçalho, picote, vazio tracejado, picote, rodapé com duas
 * linhas e o botão —, para a bancada não pular quando a inscrição montar.
 */
export function TicketInscricaoSkeleton({ className }: { className?: string }) {
    return (
        <section
            aria-hidden="true"
            className={cn(
                "bg-muted/40 flex min-w-0 flex-col rounded-xl border",
                className,
            )}
        >
            <header className="bg-card flex shrink-0 flex-col gap-1.5 rounded-t-xl px-4 py-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-48" />
            </header>

            <RecorteDoTicket />

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8">
                    <Skeleton className="size-7 rounded-full" />
                    <Skeleton className="h-3.5 w-64 max-w-full" />
                    <Skeleton className="h-3.5 w-40 max-w-full" />
                </div>
            </div>

            <RecorteDoTicket />

            <footer className="bg-card flex shrink-0 flex-col gap-3 rounded-b-xl px-4 py-3">
                <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-36" />
                </div>
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-9 w-full rounded-md" />
            </footer>
        </section>
    );
}

/**
 * O picote entre duas superfícies do bilhete: uma linha tracejada com um
 * semicírculo mordido em cada borda.
 *
 * `h-0` e `-translate-y-1/2` põem o picote exatamente sobre a linha em que
 * uma superfície acaba e a outra começa, sem ocupar altura. Os semicírculos
 * saem 1,5px para fora (`-translate-x-[1.5px]`) para cobrir a borda de 1px
 * da `section` — é isso que faz a mordida parecer cortada na borda, e não
 * desenhada por cima dela. Por isso a `section` não pode ter
 * `overflow-hidden`.
 */
function RecorteDoTicket() {
    return (
        <div
            aria-hidden="true"
            className="relative flex h-0 shrink-0 items-center"
        >
            <Semicirculo className="absolute top-0 left-0 -translate-x-[1.5px] -translate-y-1/2" />
            <span className="border-border mx-3 flex-1 border-t border-dashed" />
            <Semicirculo className="absolute top-0 right-0 translate-x-[1.5px] -translate-y-1/2 rotate-180" />
        </div>
    );
}

/**
 * Meio disco mordido na borda esquerda; o da direita é o mesmo, girado.
 *
 * Dois caminhos: o disco cheio, sem traço, na cor do fundo da página
 * (`fill-background`) — é o "buraco" —, e o arco só de traço, na cor da
 * borda (`stroke-border`), que é a borda da `section` contornando a mordida.
 * Separados porque o lado reto do disco não pode ter traço: ele cairia fora
 * da borda, como um risco vertical.
 */
function Semicirculo({ className }: { className: string }) {
    return (
        <svg
            width="6"
            height="12"
            viewBox="0 0 6 12"
            className={cn("fill-background stroke-border", className)}
        >
            <path d="M0 0.5A5.5 5.5 0 0 1 0 11.5Z" stroke="none" />
            <path
                d="M0 0.5A5.5 5.5 0 0 1 0 11.5"
                fill="none"
                strokeWidth="1"
                strokeLinejoin="round"
            />
        </svg>
    );
}
