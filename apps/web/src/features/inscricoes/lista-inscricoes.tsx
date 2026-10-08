import {
    CalendarBlankIcon,
    IdentificationCardIcon,
} from "@phosphor-icons/react/dist/ssr";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import type {
    InscricaoGrupo,
    InscricaoIndividual,
    InscricoesDaCategoria,
} from "@te-inscreve/schemas";
import { Badge } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import { formatarDataCriacao } from "~/features/entidades/grupos/grupo";
import { idadeEm, nomeCompleto } from "~/features/entidades/shared/integrantes";
import { timeAgo } from "~/shared/utils/format-date";
import { PicoteVertical, RecorteDoTicket } from "./partes-do-ticket";

/**
 * As inscrições de uma categoria, cada uma como um bilhete.
 *
 * A modalidade decide o formato da resposta, e o formato decide o bilhete:
 * a inscrição em grupo é um bilhete robusto — a entidade no cabeçalho, a
 * formação em número grande embaixo do picote —, porque ali o concorrente
 * é um conjunto de pessoas; a individual é um bilhete fino, deitado, com o
 * canhoto à esquerda e a pessoa à direita.
 *
 * Os bilhetes ficam direto sobre a página, sem moldura: a mordida dos
 * picotes tem a cor do fundo (`fill-background`).
 *
 * Por enquanto nenhum bilhete é clicável.
 */
export function ListaInscricoes({
    inscricoes,
}: {
    inscricoes: InscricoesDaCategoria;
}) {
    if (inscricoes.length === 0) {
        return (
            <div className="text-muted-foreground bg-card flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
                <TicketIcon aria-hidden="true" className="size-6" />
                <p className="text-sm font-medium">
                    Nenhuma inscrição nesta categoria ainda.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
                {inscricoes.length === 1
                    ? "1 inscrição"
                    : `${inscricoes.length} inscrições`}
            </p>

            <ul className="grid gap-3 sm:grid-cols-2">
                {inscricoes.map((inscricao) => (
                    <li key={inscricao.id} className="min-w-0">
                        {ehGrupo(inscricao) ? (
                            <BilheteGrupo inscricao={inscricao} />
                        ) : (
                            <BilheteIndividual inscricao={inscricao} />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Só a inscrição em grupo traz a contagem da formação. */
function ehGrupo(
    inscricao: InscricaoIndividual | InscricaoGrupo,
): inscricao is InscricaoGrupo {
    return "totalIntegrantes" in inscricao;
}

/**
 * A inscrição em grupo: cabeçalho com quem se apresenta, picote e a
 * formação.
 *
 * O título é o nome do concorrente quando a modalidade o exibe, e a
 * entidade desce para a linha de baixo; sem ele, a entidade é o título.
 */
function BilheteGrupo({ inscricao }: { inscricao: InscricaoGrupo }) {
    const { entidade, nomeConcorrente, totalIntegrantes } = inscricao;

    return (
        <article className="bg-card flex min-w-0 flex-col rounded-xl border">
            <header className="flex items-start gap-3 px-4 pt-4 pb-3">
                <span
                    aria-hidden="true"
                    className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-lg"
                >
                    <UsersThreeIcon size={24} weight="duotone" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold tracking-tight">
                        {nomeConcorrente ?? entidade.nome}
                    </h3>
                    <p className="text-muted-foreground truncate text-sm">
                        <BuildingsIcon
                            aria-hidden="true"
                            className="mr-1 inline size-4"
                        />
                        {nomeConcorrente
                            ? `${entidade.nome} · ${entidade.cidade}`
                            : entidade.cidade}
                    </p>
                </div>
            </header>

            <RecorteDoTicket />

            <div className="flex items-end justify-between gap-3 px-4 pt-3 pb-4">
                <p className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tabular-nums">
                        {totalIntegrantes}
                    </span>
                    <span className="text-muted-foreground text-sm">
                        {totalIntegrantes === 1 ? "integrante" : "integrantes"}
                    </span>
                </p>
                <Carimbo inscricao={inscricao} className="text-right" />
            </div>
        </article>
    );
}

/**
 * A inscrição individual: o canhoto à esquerda, a pessoa à direita,
 * separados por um picote de pé.
 *
 * `concorrente` nulo é um estado que o backend não deveria produzir, mas o
 * serializer admite — o bilhete diz que falta alguém em vez de quebrar.
 */
function BilheteIndividual({ inscricao }: { inscricao: InscricaoIndividual }) {
    const { entidade, concorrente } = inscricao;
    const nome = concorrente ? nomeCompleto(concorrente) : null;
    if (!concorrente) {
        return (
            <div className="bg-card flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border p-8 text-center">
                <p className="text-sm font-medium">Concorrente não informado</p>
            </div>
        );
    }

    return (
        <article className="bg-card flex min-w-0 rounded-xl border">
            <Carimbo
                inscricao={inscricao}
                className="flex w-24 shrink-0 flex-col items-center justify-center text-center"
            />

            <PicoteVertical />

            <div className="flex min-w-0 flex-1 items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                        {nome ?? "Concorrente não informado"}
                    </h3>

                    <p className="text-muted-foreground truncate text-xs">
                        <CalendarBlankIcon
                            aria-hidden="true"
                            className="mr-1 inline size-3"
                        />
                        {idadeEm(concorrente.dataNascimento)} anos ·{" "}
                        {formatarDataCriacao(concorrente.dataNascimento)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                        <BuildingsIcon
                            aria-hidden="true"
                            className="mr-1 inline size-3"
                        />
                        {entidade.nome} · {entidade.cidade}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                        <IdentificationCardIcon
                            aria-hidden="true"
                            className="mr-1 inline size-3"
                        />
                        {concorrente.matriculaMtg}
                    </p>
                </div>
                <Badge variant="ghost" className="text-muted-foreground">
                    {timeAgo(new Date(inscricao.dataCriacao))}
                </Badge>
            </div>
        </article>
    );
}

/** O número e a data da inscrição, como carimbo do canhoto. */
function Carimbo({
    inscricao,
    className,
}: {
    inscricao: Pick<InscricaoIndividual, "id" | "dataCriacao">;
    className?: string;
}) {
    const codigo = `#${inscricao.id.toString().padStart(4, "0")}`;
    return (
        <dl className={className}>
            <dt className="sr-only">Número da inscrição</dt>
            <dd className="text-sm font-semibold tabular-nums">{codigo}</dd>
            <dt className="sr-only">Data da inscrição</dt>
        </dl>
    );
}

/**
 * A {@link ListaInscricoes} enquanto a resposta não chega. A modalidade só
 * se sabe pela resposta, então o esqueleto fica com o bilhete fino, que é
 * o mais baixo: o robusto cresce ao chegar, em vez de encolher.
 */
export function ListaInscricoesSkeleton() {
    return (
        <div aria-hidden="true" className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <ul className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((indice) => (
                    <li key={indice} className="bg-card flex rounded-xl border">
                        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1.5">
                            <Skeleton className="h-3 w-10" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <PicoteVertical />
                        <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
                            <Skeleton className="size-9 shrink-0 rounded-full" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
