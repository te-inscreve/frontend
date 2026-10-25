import Link from "next/link";
import { notFound } from "next/navigation";
import { Buildings } from "@phosphor-icons/react/dist/ssr/Buildings";
import { CalendarDots } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { FilePdf } from "@phosphor-icons/react/dist/ssr/FilePdf";
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin";
import { Ticket } from "@phosphor-icons/react/dist/ssr/Ticket";

import { Badge, Button } from "@te-inscreve/components";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { FallbackImage } from "~/shared/ui/fallback-image";
import { formatDateRange } from "~/shared/utils/format-date";
import { BotaoCompartilhar } from "./botao-compartilhar";

/**
 * O evento como quem recebe o link o vê: sem login e sem nada de gestão.
 *
 * O `fetchQuery` reaproveita o `prefetch` da página e a busca do
 * `generateMetadata`: o query client é `cache`ado por request.
 */
export async function EventoPublico({ id }: { id: number }) {
    const evento = await getQueryClient().fetchQuery(
        trpc.evento.getById.queryOptions({ id }),
    );

    if (!evento) notFound();

    const periodo = formatDateRange(
        new Date(evento.dataInicio),
        new Date(evento.dataFim),
    );
    const periodoInscricoes = formatDateRange(
        new Date(evento.dataInicioInscricoes),
        new Date(evento.dataFimInscricoes),
    );
    const { promotor } = evento;

    return (
        <article className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
            <FallbackImage
                src={evento.cartaz}
                alt={`Cartaz de ${evento.nome}`}
                width={600}
                height={800}
                priority
                className="aspect-3/4 w-full rounded-xl border object-cover"
            />

            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-3">
                    <h1 className="text-primary text-3xl font-bold tracking-tight md:text-4xl">
                        {evento.nome}
                    </h1>
                    {evento.descricao && (
                        <p className="text-muted-foreground">
                            {evento.descricao}
                        </p>
                    )}
                </header>

                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <Dado icone={<CalendarDots />} termo="Quando">
                        {periodo}
                    </Dado>
                    <Dado icone={<MapPin />} termo="Onde">
                        {evento.local}
                    </Dado>
                    <Dado icone={<Ticket />} termo="Inscrições">
                        {periodoInscricoes}
                    </Dado>
                    <Dado icone={<Buildings />} termo="Promoção">
                        {promotor.nome}
                        {promotor.cidade &&
                            ` · ${promotor.cidade}/${promotor.estado}`}
                    </Dado>
                </dl>

                {evento.modalidades.length > 0 && (
                    <section
                        aria-labelledby="modalidades"
                        className="flex flex-col gap-2"
                    >
                        <h2 id="modalidades" className="text-sm font-semibold">
                            Modalidades
                        </h2>
                        <ul className="flex flex-wrap gap-2">
                            {evento.modalidades.map((modalidade) => (
                                <li key={modalidade.id}>
                                    <Badge variant="secondary">
                                        {modalidade.nome}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <div className="flex flex-wrap gap-3 border-t pt-6">
                    <Button asChild>
                        <Link
                            href={`/signin?next=${encodeURIComponent(`/admin/eventos/${evento.id}`)}`}
                        >
                            Entrar para se inscrever
                        </Link>
                    </Button>
                    {evento.regulamento && (
                        <Button asChild variant="outline">
                            <a
                                href={evento.regulamento}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FilePdf aria-hidden />
                                Regulamento
                            </a>
                        </Button>
                    )}
                    <BotaoCompartilhar titulo={evento.nome} />
                </div>
            </div>
        </article>
    );
}

function Dado({
    icone,
    termo,
    children,
}: {
    icone: React.ReactNode;
    termo: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex gap-3">
            <span
                aria-hidden
                className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md"
            >
                {icone}
            </span>
            <div className="flex flex-col">
                <dt className="text-muted-foreground">{termo}</dt>
                <dd className="font-medium">{children}</dd>
            </div>
        </div>
    );
}
