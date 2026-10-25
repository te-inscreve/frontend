import type { Icon } from "@phosphor-icons/react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import gauchinho from "@/public/assets/gauchinho.png";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { Buildings } from "@phosphor-icons/react/dist/ssr/Buildings";
import { Calculator } from "@phosphor-icons/react/dist/ssr/Calculator";
import { CalendarDots } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ClipboardText } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { CloudArrowUp } from "@phosphor-icons/react/dist/ssr/CloudArrowUp";
import { DeviceMobile } from "@phosphor-icons/react/dist/ssr/DeviceMobile";
import { Ranking } from "@phosphor-icons/react/dist/ssr/Ranking";
import { Ticket } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WifiSlash } from "@phosphor-icons/react/dist/ssr/WifiSlash";

import { Button } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import {
    UltimosEventos,
    UltimosEventosSkeleton,
} from "~/features/eventos/evento-publico/ultimos-eventos";
import { getSession } from "~/shared/api/auth/server";
import { prefetch, trpc } from "~/shared/api/trpc/server";

interface Recurso {
    icone: Icon;
    titulo: string;
    texto: string;
}

const recursos: Recurso[] = [
    {
        icone: CalendarDots,
        titulo: "Eventos",
        texto: "Monte o evento com suas modalidades e categorias de apresentação, e publique quando estiver pronto.",
    },
    {
        icone: Buildings,
        titulo: "Entidades",
        texto: "Cada entidade tradicionalista cuida dos seus grupos artísticos e integrantes num só lugar.",
    },
    {
        icone: Ticket,
        titulo: "Inscrições",
        texto: "Inscreva artistas e grupos nas categorias do evento, sem planilha nem papel.",
    },
    {
        icone: ClipboardText,
        titulo: "Fichas avaliativas",
        texto: "Monte o modelo de ficha de cada categoria com campos numéricos, alternativas e observações.",
    },
    {
        icone: UsersThree,
        titulo: "Avaliadores",
        texto: "Os avaliadores preenchem as avaliações no aplicativo, mesmo sem internet, e enviam quando a conexão voltar.",
    },
    {
        icone: Ranking,
        titulo: "Classificação",
        texto: "As notas saem das avaliações e viram a classificação de cada categoria.",
    },
];

const vantagensDoApp: Recurso[] = [
    {
        icone: WifiSlash,
        titulo: "Funciona sem internet",
        texto: "Categorias, inscrições e modelos de ficha descem para o aparelho antes do evento. Ginásio sem sinal não para a avaliação.",
    },
    {
        icone: ArrowCounterClockwise,
        titulo: "Retome de onde parou",
        texto: "A avaliação atual fica guardada no aparelho: dá para sair no meio e continuar depois, sem perder nada.",
    },
    {
        icone: CloudArrowUp,
        titulo: "Envio automático",
        texto: "Avaliações salvas entram numa fila e são enviadas quando a conexão volta. Uma recusada não trava as outras.",
    },
    {
        icone: Calculator,
        titulo: "Nota calculada na hora",
        texto: "A ficha inteira numa página só, com o total de cada dança ou par somado enquanto o avaliador preenche.",
    },
    {
        icone: ClockCounterClockwise,
        titulo: "Histórico do avaliador",
        texto: "Tudo o que já foi avaliado fica à mão, com o que ainda está só no aparelho destacado.",
    },
];

const passos = [
    "A entidade organizadora cria o evento e abre as inscrições.",
    "Entidades inscrevem seus grupos e artistas nas categorias.",
    "No dia, os avaliadores avaliam cada apresentação pelo app.",
    "As notas formam a classificação de cada categoria.",
];

/**
 * A página inicial da vitrine.
 *
 * Síncrona: o texto é o mesmo para todo mundo e é o que precisa aparecer
 * primeiro. Esperam a rede só os botões do topo, que dependem da sessão, e a
 * lista dos últimos eventos — cada um atrás do próprio boundary.
 * Ver `docs/fcp.md`.
 */
export default function HomePage() {
    void prefetch(trpc.evento.getAll.queryOptions());

    return (
        <div className="container mx-auto flex max-w-5xl flex-col gap-24 px-4 py-16 md:py-24">
            <section className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
                <div className="flex max-w-xl flex-col gap-6 text-center md:text-left">
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                        Inscrições e avaliações de eventos de{" "}
                        <span className="text-primary">danças gaúchas</span>
                    </h1>

                    <p className="text-muted-foreground text-lg">
                        O Te Inscreve organiza o evento de ponta a ponta: das
                        inscrições dos grupos artísticos às notas dos
                        avaliadores e à classificação final.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                        {/* O esqueleto tem a altura dos botões para o texto
                            acima não pular quando a sessão chega. */}
                        <Suspense
                            fallback={
                                <Skeleton className="h-10 w-72 rounded-md" />
                            }
                        >
                            <AcoesDaSessao />
                        </Suspense>
                    </div>
                </div>

                <Image
                    src={gauchinho}
                    alt=""
                    priority
                    className="h-auto w-48 shrink-0 md:w-64"
                />
            </section>

            <section aria-labelledby="recursos" className="flex flex-col gap-8">
                <h2
                    id="recursos"
                    className="text-2xl font-semibold tracking-tight"
                >
                    Tudo o que o evento precisa
                </h2>

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recursos.map(({ icone: Icone, titulo, texto }) => (
                        <li
                            key={titulo}
                            className="bg-card flex flex-col gap-3 rounded-lg border p-5"
                        >
                            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                                <Icone aria-hidden />
                            </span>
                            <h3 className="font-semibold">{titulo}</h3>
                            <p className="text-muted-foreground text-sm">
                                {texto}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>

            <Suspense fallback={<UltimosEventosSkeleton />}>
                <UltimosEventos />
            </Suspense>

            <section
                aria-labelledby="como-funciona"
                className="flex flex-col gap-8"
            >
                <h2
                    id="como-funciona"
                    className="text-2xl font-semibold tracking-tight"
                >
                    Como funciona
                </h2>

                <ol className="grid gap-6 md:grid-cols-4">
                    {passos.map((passo, i) => (
                        <li key={passo} className="flex flex-col gap-2">
                            <span className="text-primary text-3xl font-bold tabular-nums">
                                {i + 1}
                            </span>
                            <p className="text-sm">{passo}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <AppMovel />

            <footer className="text-muted-foreground border-t pt-8 text-sm">
                Te Inscreve — feito para os eventos tradicionalistas do Rio
                Grande do Sul.
            </footer>
        </div>
    );
}

/**
 * Cadastro e login para quem chega; quem já tem sessão vai direto ao painel.
 * Separado da página porque é a única peça do topo que depende da rede.
 */
async function AcoesDaSessao() {
    const session = await getSession();

    if (session) {
        return (
            <Button asChild size="lg">
                <Link href="/admin/eventos">
                    Ir para a administração
                    <ArrowRight />
                </Link>
            </Button>
        );
    }

    return (
        <>
            <Button asChild size="lg">
                <Link href="/signup">
                    Criar conta
                    <ArrowRight />
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
                <Link href="/signin">Já tenho conta</Link>
            </Button>
        </>
    );
}

/**
 * O app do avaliador, com uma ficha de mentira desenhada ao lado.
 *
 * O desenho é só marcação: nada aqui vem da API, para a seção continuar
 * estática como o resto da página.
 */
function AppMovel() {
    return (
        <section
            aria-labelledby="app-movel"
            className="bg-muted/50 -mx-4 flex flex-col gap-12 rounded-none px-4 py-12 sm:mx-0 sm:rounded-2xl sm:px-8 md:flex-row md:items-center md:gap-16 md:px-12"
        >
            <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <span className="text-primary flex items-center gap-2 text-sm font-semibold">
                        <DeviceMobile aria-hidden />
                        Aplicativo do avaliador
                    </span>
                    <h2
                        id="app-movel"
                        className="text-2xl font-semibold tracking-tight md:text-3xl"
                    >
                        A avaliação acontece na palma da mão
                    </h2>
                    <p className="text-muted-foreground">
                        Feito para o dia do evento: o avaliador leva o aparelho
                        para a beira do tablado e preenche cada ficha enquanto a
                        apresentação acontece, sem papel e sem depender da rede
                        do local.
                    </p>
                </div>

                <ul className="flex flex-col gap-5">
                    {vantagensDoApp.map(({ icone: Icone, titulo, texto }) => (
                        <li key={titulo} className="flex gap-4">
                            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                                <Icone aria-hidden />
                            </span>
                            <div className="flex flex-col gap-1">
                                <h3 className="font-semibold">{titulo}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {texto}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <FichaIlustrada />
        </section>
    );
}

function FichaIlustrada() {
    const campos = [
        { nome: "Coreografia", nota: "9,5" },
        { nome: "Harmonia", nota: "9,0" },
        { nome: "Indumentária", nota: "10,0" },
    ];

    return (
        <div
            aria-hidden
            className="bg-background mx-auto w-64 shrink-0 rounded-[2.5rem] border-8 border-neutral-900 p-4 shadow-xl dark:border-neutral-700"
        >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-neutral-300 dark:bg-neutral-700" />

            <div className="bg-muted mb-4 flex items-center justify-between rounded-full px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1.5">
                    <WifiSlash className="size-3.5!" />
                    Sem conexão
                </span>
                <span className="text-muted-foreground">2 na fila</span>
            </div>

            <p className="text-muted-foreground text-xs">Danças tradicionais</p>
            <p className="mb-4 text-sm font-semibold">Invernada adulta</p>

            <div className="flex flex-col gap-2">
                {campos.map((campo) => (
                    <div
                        key={campo.nome}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                        <span>{campo.nome}</span>
                        <span className="font-semibold tabular-nums">
                            {campo.nota}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-primary text-lg font-bold tabular-nums">
                    28,5
                </span>
            </div>

            <div className="bg-primary text-primary-foreground mt-4 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium">
                <CheckCircle className="size-4!" />
                Salvar avaliação
            </div>
        </div>
    );
}
