import { notFound } from "next/navigation";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";

import { detalheEvento } from "~/app/admin/eventos/[slug]/mock";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { formatDateRange } from "~/shared/utils/format-date";
import { ListCategorias } from "./list-categorias";

interface Props {
    id: number;
}

/**
 * Server Component que só resolve depois que o evento chega. Fica atrás de um
 * `<Suspense>` na página, então o shell é enviado na hora e este bloco entra
 * no stream já renderizado no servidor — sem JS de cliente para o conteúdo.
 *
 * O `fetchQuery` reaproveita o `prefetch` disparado pela página: o query client
 * é `cache`ado por request, então aqui só se aguarda a promise já em voo.
 */
export async function DetalheEvento({ id }: Props) {
    const evento = await getQueryClient().fetchQuery(
        trpc.evento.getById.queryOptions({ id }),
    );

    if (!evento) notFound();

    const periodo = formatDateRange(
        new Date(evento.dataInicio),
        new Date(evento.dataFim),
    );

    // As modalidades ainda não vêm do backend, então seguem vindo do mock.
    // `value` de cada aba é string, então o padrão também precisa ser — e fica
    // indefinido quando não há modalidade nenhuma para selecionar.
    const primeiraModalidade = detalheEvento.modalidades[0]?.id;
    const modalidadePadrao =
        primeiraModalidade === undefined
            ? undefined
            : String(primeiraModalidade);

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

            <h3 className="text-xl font-bold">Modalidades e categorias</h3>
            <Tabs defaultValue={modalidadePadrao}>
                <TabsList variant="line">
                    {detalheEvento.modalidades.map((modalidade) => (
                        <TabsTrigger
                            key={modalidade.id}
                            value={String(modalidade.id)}
                        >
                            {modalidade.nome}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {detalheEvento.modalidades.map((modalidade) => (
                    <TabsContent
                        key={modalidade.id}
                        value={String(modalidade.id)}
                        className="mt-4 w-full"
                    >
                        <ListCategorias modalidade={modalidade} />
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}
