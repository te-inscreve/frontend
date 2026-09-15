import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UserCheckIcon } from "@phosphor-icons/react/dist/ssr/UserCheck";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import {
    Button,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { BotaoEditarCategoria } from "./botao-editar-categoria";
import { PainelNaoImplementado } from "./painel-nao-implementado";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

/**
 * Detalhe de uma categoria: o resumo dela e os dois painéis de abas que vão
 * receber as telas de cronograma, inscritos, avaliadores e ficha avaliativa.
 *
 * Server Component atrás do `<Suspense>` da página, no mesmo desenho do
 * `DetalheEvento` — o shell vai para o stream sem esperar a resposta.
 */
export async function DetalheCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: Props) {
    const categoria = await getQueryClient().fetchQuery(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    // Nulo é 404 do backend: categoria que não existe, ou que não pertence à
    // modalidade daquele evento.
    if (!categoria) notFound();

    return (
        <>
            <header className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start gap-3">
                    <h1 className="text-primary mr-auto text-4xl font-bold">
                        {categoria.nome}
                    </h1>

                    <Button asChild>
                        <Link
                            href={`/admin/eventos/${eventoId}/inscricoes/novo?modalidade=${modalidadeId}&categoria=${categoriaId}`}
                        >
                            Inscrever-se
                        </Link>
                    </Button>
                    <BotaoEditarCategoria
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        categoria={categoria}
                    />
                </div>
                <dl className="text-muted-foreground flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
                    <Resumo
                        icone={<UsersThreeIcon />}
                        termo="Faixa etária"
                        valor={`De ${categoria.idadeMinima} a ${categoria.idadeMaxima} anos`}
                    />
                    <Resumo
                        icone={<TicketIcon />}
                        termo="Limite de inscrições"
                        // Nulo é ausência de teto, e não zero inscrições.
                        valor={
                            categoria.maxInscricoes === null
                                ? "Sem limite"
                                : `Até ${categoria.maxInscricoes}`
                        }
                    />
                    <Resumo
                        icone={<UserCheckIcon />}
                        termo="Avaliadores"
                        // Nulo é categoria sem avaliador definido, não zero.
                        valor={
                            categoria.avaliadores === null
                                ? "Nenhum definido"
                                : String(categoria.avaliadores)
                        }
                    />
                </dl>
            </header>

            {/* Dois grupos de abas independentes. Em telas largas o painel
                principal fica à direita e o de avaliação à esquerda, mais
                estreito; empilhados, o principal vem primeiro. */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Tabs
                    defaultValue="cronograma"
                    className="lg:order-1 lg:col-span-2"
                >
                    <TabsList variant="line" className="w-full justify-start">
                        <TabsTrigger value="cronograma" className="flex-none">
                            <CalendarDotsIcon />
                            Cronograma
                        </TabsTrigger>
                        <TabsTrigger value="inscritos" className="flex-none">
                            <UsersThreeIcon />
                            Inscritos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cronograma" className="mt-4">
                        <PainelNaoImplementado>
                            Cronograma da categoria
                        </PainelNaoImplementado>
                    </TabsContent>
                    <TabsContent value="inscritos" className="mt-4">
                        <PainelNaoImplementado>
                            Inscritos da categoria
                        </PainelNaoImplementado>
                    </TabsContent>
                </Tabs>

                <Tabs defaultValue="avaliadores" className="lg:order-2">
                    <TabsList variant="line" className="w-full justify-start">
                        <TabsTrigger value="avaliadores" className="flex-none">
                            <UserCheckIcon />
                            Avaliadores
                        </TabsTrigger>
                        <TabsTrigger value="ficha" className="flex-none">
                            <ClipboardTextIcon />
                            Ficha avaliativa
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="avaliadores" className="mt-4">
                        <PainelNaoImplementado>
                            Avaliadores da categoria
                        </PainelNaoImplementado>
                    </TabsContent>
                    <TabsContent value="ficha" className="mt-4">
                        <PainelNaoImplementado>
                            Ficha avaliativa da categoria
                        </PainelNaoImplementado>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function Resumo({
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
            <span aria-hidden="true" className="[&_svg]:size-4">
                {icone}
            </span>
            <dt className="sr-only">{termo}</dt>
            <dd>{valor}</dd>
        </div>
    );
}
