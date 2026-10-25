import Link from "next/link";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { UserCheckIcon } from "@phosphor-icons/react/dist/ssr/UserCheck";

import type { AvaliadorDaCategoria } from "@te-inscreve/schemas";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import {
    formatarNota,
    hrefFichasDaInscricao,
} from "~/features/avaliacoes/avaliacao-preenchida/lib/avaliacoes-da-inscricao";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { nomeDaInscricaoAvaliada } from "./lib/inscricao-avaliada";

interface Props {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
}

/**
 * A aba de avaliadores da categoria: quem já avaliou alguma inscrição, cada
 * um com as inscrições que avaliou e a nota que deu.
 *
 * Server Component atrás do seu próprio `<Suspense>`: o `fetchQuery`
 * reaproveita o `prefetch` da página. Ao contrário da classificação, a lista
 * sai em qualquer situação da categoria, então vazia quer dizer só que
 * ninguém avaliou ainda.
 */
export async function AvaliadoresDaCategoria({
    eventoId,
    modalidadeId,
    categoriaId,
}: Props) {
    const avaliadores = await getQueryClient().fetchQuery(
        trpc.categoria.getAvaliadores.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );

    if (avaliadores.length === 0) {
        return (
            <div className="bg-card flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
                <UserCheckIcon
                    aria-hidden="true"
                    className="text-muted-foreground size-10"
                    weight="duotone"
                />
                <p className="font-medium">Nenhuma avaliação enviada</p>
                <p className="text-muted-foreground max-w-xs text-sm">
                    Os avaliadores aparecem aqui assim que enviarem a primeira
                    ficha da categoria.
                </p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {avaliadores.map((avaliador) => (
                <li key={avaliador.id}>
                    <CartaoAvaliador
                        eventoId={eventoId}
                        modalidadeId={modalidadeId}
                        categoriaId={categoriaId}
                        avaliador={avaliador}
                        // Um avaliador só não tem com quem dividir espaço.
                        aberto={avaliadores.length === 1}
                    />
                </li>
            ))}
        </ul>
    );
}

/**
 * Um avaliador, recolhido no nome e na contagem. Aberto, lista as inscrições
 * que avaliou; cada uma leva às fichas preenchidas dela.
 */
function CartaoAvaliador({
    eventoId,
    modalidadeId,
    categoriaId,
    avaliador,
    aberto,
}: Props & { avaliador: AvaliadorDaCategoria; aberto: boolean }) {
    const nome = avaliador.nome.trim();
    const total = avaliador.inscricoes.length;

    return (
        <Collapsible
            defaultOpen={aberto}
            className="bg-card group/avaliador rounded-xl border"
        >
            <CollapsibleTrigger className="hover:bg-accent/50 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors outline-none focus-visible:ring-[3px]">
                <span
                    aria-hidden="true"
                    className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg text-sm font-bold"
                >
                    {nome ? (
                        iniciais(nome)
                    ) : (
                        <UserCheckIcon className="size-5" />
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                        {nome || "Avaliador sem nome"}
                    </span>
                    <span className="text-muted-foreground block text-sm">
                        {total === 1
                            ? "1 inscrição avaliada"
                            : `${total} inscrições avaliadas`}
                    </span>
                </span>
                <CaretDownIcon
                    aria-hidden="true"
                    className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/avaliador:rotate-180"
                />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <ol className="flex flex-col border-t p-1">
                    {avaliador.inscricoes.map((inscricao) => {
                        const nomeInscricao =
                            nomeDaInscricaoAvaliada(inscricao);
                        const entidade =
                            nomeInscricao !== inscricao.entidade.nome
                                ? inscricao.entidade.nome
                                : inscricao.entidade.cidade;

                        return (
                            <li key={inscricao.id}>
                                <Link
                                    href={hrefFichasDaInscricao({
                                        eventoId,
                                        modalidadeId,
                                        categoriaId,
                                        inscricaoId: inscricao.id,
                                    })}
                                    className="hover:bg-accent/50 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors outline-none focus-visible:ring-[3px]"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">
                                            {nomeInscricao}
                                        </span>
                                        <span className="text-muted-foreground block truncate text-xs">
                                            {entidade}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 flex-col items-end">
                                        <span className="text-muted-foreground text-xs">
                                            Nota
                                        </span>
                                        <span className="font-bold tabular-nums">
                                            {formatarNota(inscricao.nota)}
                                        </span>
                                    </span>
                                    <CaretRightIcon
                                        aria-hidden="true"
                                        className="text-muted-foreground size-4 shrink-0"
                                    />
                                    <span className="sr-only">
                                        : ver as fichas avaliativas
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            </CollapsibleContent>
        </Collapsible>
    );
}

/** `"Ana Souza"` → `"AS"`; `"Ana"` → `"A"`. */
function iniciais(nome: string) {
    const partes = nome.split(/\s+/);
    const primeira = partes[0]?.[0] ?? "";
    const ultima = partes.length > 1 ? (partes.at(-1)?.[0] ?? "") : "";
    return `${primeira}${ultima}`.toUpperCase();
}

/** A {@link AvaliadoresDaCategoria} enquanto a resposta não chega. */
export function AvaliadoresDaCategoriaSkeleton() {
    return (
        <ul aria-hidden="true" className="flex flex-col gap-2">
            {[0, 1, 2].map((indice) => (
                <li
                    key={indice}
                    className="bg-card flex items-center gap-3 rounded-xl border p-3"
                >
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="size-4" />
                </li>
            ))}
        </ul>
    );
}
