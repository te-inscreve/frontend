import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";

import { Badge, Button } from "@te-inscreve/components";

import type { EventoAtualMock, InscricaoMock } from "./mock-entidade";
import { formatDateRange } from "~/shared/utils/format-date";

interface Props {
    /** Nulo quando a entidade não tem inscrição em nenhum evento aberto. */
    evento: EventoAtualMock | null;
}

/**
 * O evento em que a entidade está inscrita agora, com o que ela já colocou em
 * cada modalidade.
 *
 * É o bloco mais alto da página porque é a única parte com prazo: as demais
 * seções descrevem a entidade, esta cobra uma ação antes de a inscrição fechar.
 */
export function EventoAtual({ evento }: Props) {
    if (!evento) {
        return (
            <div className="text-muted-foreground flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
                <p className="text-sm">
                    Sua entidade ainda não tem inscrições em um evento aberto.
                    Escolha um evento para inscrever seus grupos e integrantes.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/admin/eventos">
                        Ver eventos
                        <ArrowRightIcon aria-hidden="true" />
                    </Link>
                </Button>
            </div>
        );
    }

    const periodo = formatDateRange(
        dataLocal(evento.dataInicio),
        dataLocal(evento.dataFim),
    );
    const prazo = dataLocal(evento.inscricoesAte).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
    });

    const pendentes = evento.inscricoes.filter(
        ({ situacao }) => situacao === "pendente",
    ).length;
    const confirmadas = evento.inscricoes.length - pendentes;

    return (
        <div className="bg-card overflow-hidden rounded-xl border">
            {/* A faixa colorida separa o evento do resto da página sem precisar
                de sombra: é o único bloco com prazo correndo. */}
            <div className="bg-primary/10 border-primary/20 flex flex-col gap-2 border-b p-4 md:p-5">
                <h3 className="text-xl font-bold tracking-tight text-balance">
                    {evento.nome}
                </h3>
                <dl className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <Info
                        icone={<CalendarDotsIcon />}
                        termo="Período"
                        valor={periodo}
                    />
                    <Info
                        icone={<MapPinIcon />}
                        termo="Local"
                        valor={evento.local}
                    />
                    <Info
                        icone={<ClockIcon />}
                        termo="Prazo de inscrição"
                        valor={`Inscrições até ${prazo}`}
                    />
                </dl>
            </div>

            <div className="flex flex-col gap-3 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">
                        Inscrições da entidade
                    </h4>
                    <p className="text-muted-foreground text-sm">
                        {confirmadas} confirmadas
                        {pendentes > 0 && ` · ${pendentes} pendentes`}
                    </p>
                </div>

                <ul className="flex flex-col gap-2">
                    {evento.inscricoes.map((inscricao) => (
                        <ItemInscricao
                            key={inscricao.id}
                            inscricao={inscricao}
                        />
                    ))}
                </ul>

                {pendentes > 0 && (
                    <p className="text-muted-foreground text-sm">
                        {pendentes === 1
                            ? "1 inscrição ainda depende da confirmação da comissão do evento."
                            : `${pendentes} inscrições ainda dependem da confirmação da comissão do evento.`}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Lê uma data sem horário como dia do calendário, e não como instante.
 *
 * `new Date("2026-09-18")` é meia-noite em UTC, que no fuso do Brasil ainda é
 * dia 17 — o evento apareceria começando um dia antes. Montando a data campo a
 * campo, o dia é o que está escrito.
 */
function dataLocal(iso: string): Date {
    const [ano, mes, dia] = iso.split("-").map(Number);
    return new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1);
}

function ItemInscricao({ inscricao }: { inscricao: InscricaoMock }) {
    const ehGrupo = inscricao.tipo === "grupo";
    const confirmada = inscricao.situacao === "confirmada";

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <div className="flex min-w-0 items-center gap-3">
                <span
                    aria-hidden="true"
                    className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
                >
                    {ehGrupo ? (
                        <UsersFourIcon size={16} />
                    ) : (
                        <UserIcon size={16} />
                    )}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {inscricao.participante}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                        {inscricao.modalidade} · {inscricao.categoria}
                    </p>
                </div>
            </div>

            {/* Cor sozinha não distingue os dois estados: cada um tem rótulo e
                ícone próprios. */}
            <Badge
                variant={confirmada ? "outline" : "secondary"}
                className={confirmada ? "text-primary" : undefined}
            >
                {confirmada ? (
                    <CheckCircleIcon aria-hidden="true" />
                ) : (
                    <ClockIcon aria-hidden="true" />
                )}
                {confirmada ? "Confirmada" : "Pendente"}
            </Badge>
        </li>
    );
}

function Info({
    icone,
    termo,
    valor,
}: {
    icone: React.ReactNode;
    termo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <span aria-hidden="true" className="flex [&_svg]:size-4">
                {icone}
            </span>
            <dt className="sr-only">{termo}</dt>
            <dd>{valor}</dd>
        </div>
    );
}
