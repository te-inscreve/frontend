import { GlobeSimpleIcon } from "@phosphor-icons/react/dist/ssr/GlobeSimple";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";

import type { PosicaoFicha } from "@te-inscreve/schemas";
import { Skeleton } from "@te-inscreve/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { exibirCampoGlobal } from "../editor-modelo-ficha/lib/campo-exibido";
import { FolhaModeloFicha } from "./folha-modelo-ficha";

/**
 * O modelo de ficha inteiro, na {@link FolhaModeloFicha}, com o selo e a
 * versão na borda da prancheta, como no cartão da listagem.
 *
 * Server Component atrás do seu próprio `<Suspense>`: o `fetchQuery`
 * reaproveita o `prefetch` disparado pela página.
 */
export async function DetalheModeloFicha({ id }: { id: number }) {
    const modelo = await getQueryClient().fetchQuery(
        trpc.fichaAvaliativa.getById.queryOptions({ id }),
    );

    return (
        <FolhaModeloFicha
            nome={modelo.nome}
            camposGerais={camposDaFolha(modelo.camposGerais)}
            agrupamentos={porOrdem(modelo.agrupamentos).map((agrupamento) => ({
                chave: agrupamento.id,
                nome: agrupamento.nome,
                quantidade: agrupamento.quantidade,
                campos: camposDaFolha(agrupamento.campos),
            }))}
            mensagemVazia="Este modelo ainda não tem campos."
            rodape={
                <>
                    {modelo.global ? (
                        <span className="flex items-center gap-1">
                            <GlobeSimpleIcon
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Global
                        </span>
                    ) : (
                        !modelo.editavel && (
                            <span className="flex items-center gap-1">
                                <LockSimpleIcon
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                                Somente leitura
                            </span>
                        )
                    )}
                    <span className="ml-auto shrink-0 tabular-nums">
                        <span className="sr-only">Versão </span>v{modelo.versao}
                    </span>
                </>
            }
        />
    );
}

function porOrdem<T extends { ordem: number }>(itens: T[]) {
    return [...itens].sort((a, b) => a.ordem - b.ordem);
}

function camposDaFolha(posicoes: PosicaoFicha[]) {
    return porOrdem(posicoes).map((posicao) => ({
        chave: posicao.id,
        campo: exibirCampoGlobal(posicao.campo),
    }));
}

/** A prancheta vazia, do tamanho da que vai chegar. */
export function DetalheModeloFichaSkeleton() {
    return (
        <div aria-hidden="true" className="pt-2.5">
            <Skeleton className="min-h-[70vh] w-full rounded-xl" />
        </div>
    );
}
