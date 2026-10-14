import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ClipboardTextIcon,
    RankingIcon,
    UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr/SealCheck";
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

import { FichaAvaliativaVazia } from "~/features/avaliacoes/ficha-avaliativa/ficha-avaliativa-vazia";
import { SituacaoCategoriaBadge } from "~/features/categorias/situacao-categoria-badge";
import { ListaInscricoesSkeleton } from "~/features/inscricoes/lista-inscricoes";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { AcoesCategoria } from "./acoes-categoria";
import { BotaoEditarCategoria } from "./botao-editar-categoria";
import { InscricoesDaCategoria } from "./inscricoes-da-categoria";
import { IsGroupBadge } from "./is-group-badge";
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
    // O evento já foi disparado pela página (é a mesma requisição da trilha):
    // daqui sai o período que limita o dia da apresentação na edição.
    const [categoria, modalidade, evento] = await Promise.all([
        getQueryClient().fetchQuery(
            trpc.categoria.getById.queryOptions({
                eventoId,
                modalidadeId,
                categoriaId,
            }),
        ),
        getQueryClient().fetchQuery(
            trpc.modalidade.getById.queryOptions({
                eventoId,
                modalidadeId,
            }),
        ),
        getQueryClient().fetchQuery(
            trpc.evento.getById.queryOptions({ id: eventoId }),
        ),
    ]);

    // Nulo é 404 do backend: categoria que não existe, ou que não pertence à
    // modalidade daquele evento.
    if (!categoria || !modalidade || !evento) notFound();

    return (
        <>
            <header className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="mr-auto flex flex-wrap items-center gap-3">
                        <h1 className="text-primary text-4xl font-bold">
                            {modalidade.nome} - {categoria.nome}
                        </h1>
                        <SituacaoCategoriaBadge situacao={categoria.situacao} />
                        <IsGroupBadge isGroup={modalidade.isGrupo} />
                    </div>

                    {/* Uma inscrição por entidade: quem já tem a sua vê o
                        aviso no lugar do botão, com a mesma altura dele. */}
                    {categoria.canInscrever ? (
                        <Button asChild>
                            <Link
                                href={`/admin/eventos/${eventoId}/modalidades/${modalidadeId}/categorias/${categoriaId}/inscricoes/criar`}
                            >
                                <TicketIcon className="size-4" weight="bold" />
                                Criar Inscrição
                            </Link>
                        </Button>
                    ) : (
                        <p className="text-muted-foreground bg-card inline-flex h-9 items-center gap-1 rounded-md border border-dashed px-3 text-sm">
                            <SealCheckIcon
                                aria-hidden="true"
                                className="text-primary size-4"
                                weight="fill"
                            />
                            Entidade já inscrita
                        </p>
                    )}
                    <BotaoEditarCategoria
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        categoria={categoria}
                        periodoEvento={{
                            inicio: evento.dataInicio,
                            fim: evento.dataFim,
                        }}
                    />
                    <AcoesCategoria
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        categoria={categoria}
                    />
                </div>
                <dl className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
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
                                ? "Sem limite de inscrições"
                                : `Até ${categoria.maxInscricoes} inscrições`
                        }
                    />
                    {/* <Resumo
                        icone={<TicketIcon />}
                        termo="Limite de inscrições por entidade"
                        // Nulo é ausência de teto, e não zero inscrições.
                        valor={
                            modalidade.maxInscricoesEntidadePorCategoria ===
                            null
                                ? "Sem limite por entidade"
                                : `Até ${modalidade.maxInscricoesEntidadePorCategoria} inscrições por entidade`
                        }
                    /> */}
                    <Resumo
                        icone={
                            modalidade.isGrupo ? (
                                <UsersThreeIcon />
                            ) : (
                                <UserIcon />
                            )
                        }
                        termo="Formato"
                        // Nulo é categoria sem avaliador definido, não zero.
                        valor={`Modalidade ${modalidade.isGrupo ? " em grupo" : " individual"}`}
                    />
                </dl>
            </header>

            {/* Dois grupos de abas independentes. Em telas largas o painel
                principal fica à direita e o de avaliação à esquerda, mais
                estreito; empilhados, o principal vem primeiro. */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Tabs
                    defaultValue="inscritos"
                    className="lg:order-1 lg:col-span-2"
                >
                    <TabsList variant="line" className="w-full justify-start">
                        <TabsTrigger value="inscritos" className="flex-none">
                            <UsersThreeIcon />
                            Inscritos
                        </TabsTrigger>
                        <TabsTrigger value="cronograma" className="flex-none">
                            <CalendarDotsIcon />
                            Cronograma
                        </TabsTrigger>
                        <TabsTrigger
                            value="classificacoes"
                            className="flex-none"
                        >
                            <RankingIcon />
                            Classificações
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="inscritos" className="mt-4">
                        <Suspense fallback={<ListaInscricoesSkeleton />}>
                            <InscricoesDaCategoria
                                eventoId={eventoId}
                                modalidadeId={modalidadeId}
                                categoriaId={categoriaId}
                                isGrupo={modalidade.isGrupo}
                            />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="cronograma" className="mt-4">
                        <PainelNaoImplementado>
                            Cronograma da categoria
                        </PainelNaoImplementado>
                    </TabsContent>
                    <TabsContent value="classificacoes" className="mt-4">
                        <PainelNaoImplementado>
                            Classificações da categoria
                        </PainelNaoImplementado>
                    </TabsContent>
                </Tabs>

                <Tabs defaultValue="ficha" className="lg:order-2">
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
                        <FichaAvaliativaVazia categoriaId={categoriaId} />
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
            <span
                aria-hidden="true"
                className="text-muted-foreground [&_svg]:size-4"
            >
                {icone}
            </span>
            <dt className="sr-only">{termo}</dt>
            <dd>{valor}</dd>
        </div>
    );
}
