import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { formatDateRange } from "~/shared/utils/format-date";
import { DetalheModalidade } from "./detalhe-modalidade";
import { DetalheModalidadeSkeleton } from "./detalhe-modalidade-skeleton";
import { TabCriarModalidade } from "./tab-criar-modalidade";

interface Props {
    id: number;
    /** Aba escolhida na URL. Ausente na primeira visita à página. */
    modalidadeAtiva?: number;
}

/**
 * Server Component que só resolve depois que o evento chega. Fica atrás de um
 * `<Suspense>` na página, então o shell é enviado na hora e este bloco entra
 * no stream já renderizado no servidor — sem JS de cliente para o conteúdo.
 *
 * O `fetchQuery` reaproveita o `prefetch` disparado pela página: o query client
 * é `cache`ado por request, então aqui só se aguarda a promise já em voo.
 */
export async function DetalheEvento({ id, modalidadeAtiva }: Props) {
    const evento = await getQueryClient().fetchQuery(
        trpc.evento.getById.queryOptions({ id }),
    );

    if (!evento) notFound();

    const periodo = formatDateRange(
        new Date(evento.dataInicio),
        new Date(evento.dataFim),
    );

    // As abas saem do próprio evento: `modalidades` já vem com id e nome.
    const modalidades = evento.modalidades;

    // Buscar em vez de confiar no parâmetro: um `?modalidade=` de link antigo
    // aponta para modalidade que já não existe, e aí a primeira aba vale.
    const ativa =
        modalidades.find(({ id }) => id === modalidadeAtiva) ?? modalidades[0];

    return (
        <>
            <header className="flex flex-col gap-2">
                <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                    {evento.nome}
                </h1>
                <p className="text-muted-foreground">{evento.descricao}</p>
                <div className="text-muted-foreground flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
                    <p className="flex items-center gap-2">
                        <CalendarDotsIcon aria-hidden="true" />
                        {periodo}
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPinIcon aria-hidden="true" />
                        {evento.local}
                    </p>
                </div>
            </header>

            {ativa === undefined ? (
                // Sem modalidade não há aba de verdade, mas a linha continua
                // ali com o atalho — é o mesmo lugar de sempre para criar.
                <div className="flex flex-col gap-4">
                    <div className="border-border flex h-9 w-full items-center border-b p-0.75">
                        <TabCriarModalidade eventoId={id} />
                    </div>
                    <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
                        Este evento ainda não tem modalidades. Crie a primeira
                        para montar as categorias.
                    </p>
                </div>
            ) : (
                // Controlado pela URL e sem `onValueChange`: quem troca a aba é
                // a navegação dos links abaixo, não o estado do Radix.
                <Tabs value={String(ativa.id)} activationMode="manual">
                    {/* A linha de baixo é do invólucro, e não da lista: assim
                        ela atravessa a página inteira em vez de parar onde a
                        última aba termina, e continua fixa enquanto as abas
                        rolam. O `pb` na lista abriga o sublinhado da aba ativa,
                        que é desenhado 5px abaixo do gatilho — sem essa folga
                        ele estouraria a caixa e viraria uma barra de rolagem
                        vertical na régua de abas. */}
                    <TabsList
                        variant="line"
                        className="w-max min-w-full justify-start border-b"
                    >
                        {modalidades.map((modalidade) => (
                            <TabsTrigger
                                key={modalidade.id}
                                value={String(modalidade.id)}
                                className="flex-none"
                                asChild
                            >
                                {/* `replace` porque as abas não são etapas: o
                                        voltar do navegador deve sair da página, e
                                        não desfazer aba por aba. `scroll={false}`
                                        mantém a lista no lugar ao trocar. */}
                                <Link
                                    replace
                                    scroll={false}
                                    href={`/admin/eventos/${id}?modalidade=${modalidade.id}`}
                                >
                                    {modalidade.nome}
                                </Link>
                            </TabsTrigger>
                        ))}

                        <TabCriarModalidade eventoId={id} />
                    </TabsList>

                    {/* Só a aba ativa é montada — o detalhe das outras nem
                        chega a ser buscado. */}
                    <TabsContent
                        value={String(ativa.id)}
                        className="mt-4 w-full"
                    >
                        {/* `key` na fronteira: sem ela o React reaproveita o
                            conteúdo da aba anterior e a troca fica parada até a
                            resposta chegar, em vez de mostrar o esqueleto. */}
                        <Suspense
                            key={ativa.id}
                            fallback={<DetalheModalidadeSkeleton />}
                        >
                            <DetalheModalidade
                                eventoId={id}
                                modalidadeId={ativa.id}
                                modalidadeNome={ativa.nome}
                            />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            )}
        </>
    );
}
