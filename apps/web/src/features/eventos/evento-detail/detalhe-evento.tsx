import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import {
    Button,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { formatDateRange } from "~/shared/utils/format-date";
import { ListCategorias } from "./list-categorias";
import { ListCategoriasSkeleton } from "./list-categorias-skeleton";

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
    const queryClient = getQueryClient();

    const evento = await queryClient.fetchQuery(
        trpc.evento.getById.queryOptions({ id }),
    );

    if (!evento) notFound();

    const modalidades = await queryClient.fetchQuery(
        trpc.modalidade.getAll.queryOptions({ eventoId: id }),
    );

    const periodo = formatDateRange(
        new Date(evento.dataInicio),
        new Date(evento.dataFim),
    );

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

            {/* O botão fica no cabeçalho da seção, e não no estado vazio:
                assim ele está no mesmo lugar com ou sem modalidade. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Modalidades e categorias</h3>

                <Button asChild>
                    <Link href={`/admin/eventos/${id}/criar-modalidade`}>
                        <PlusIcon aria-hidden="true" />
                        Criar modalidade
                    </Link>
                </Button>
            </div>

            {ativa === undefined ? (
                <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
                    Este evento ainda não tem modalidades. Crie a primeira para
                    montar as categorias.
                </p>
            ) : (
                // Controlado pela URL e sem `onValueChange`: quem troca a aba é
                // a navegação dos links abaixo, não o estado do Radix.
                <Tabs value={String(ativa.id)} activationMode="manual">
                    <TabsList variant="line">
                        {modalidades.map((modalidade) => (
                            <TabsTrigger
                                key={modalidade.id}
                                value={String(modalidade.id)}
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
                    </TabsList>

                    {/* Só a aba ativa é montada — as categorias das outras nem
                        chegam a ser buscadas. */}
                    <TabsContent
                        value={String(ativa.id)}
                        className="mt-4 w-full"
                    >
                        {/* `key` na fronteira: sem ela o React reaproveita o
                            conteúdo da aba anterior e a troca fica parada até a
                            resposta chegar, em vez de mostrar o esqueleto. */}
                        <Suspense
                            key={ativa.id}
                            fallback={<ListCategoriasSkeleton />}
                        >
                            <ListCategorias eventoId={id} modalidade={ativa} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            )}
        </>
    );
}
