import { Suspense, use } from "react";

import type { CategoriaDeOrigem } from "~/features/avaliacoes/ficha-avaliativa/lib/categoria-de-origem";
import { EditorModeloFicha } from "~/features/avaliacoes/editor-modelo-ficha/editor-modelo-ficha";
import { EditorModeloFichaSkeleton } from "~/features/avaliacoes/editor-modelo-ficha/editor-modelo-ficha-skeleton";
import { lerCategoriaDeOrigem } from "~/features/avaliacoes/ficha-avaliativa/lib/categoria-de-origem";
import { PortaoDaEntidade } from "~/features/entidades/solicitar-acesso/portao-da-entidade";
import { getQueryClient, prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Novo modelo de ficha | Te Inscreve",
    description: "Montagem de um modelo de ficha avaliativa da entidade",
};

/**
 * O modelo nasce na entidade de quem está logado — o backend responde 403 ao
 * `POST` de quem não tem uma. Sem vínculo, o portão troca o editor pelo pedido
 * de acesso em vez de deixar montar uma ficha que não pode ser salva.
 *
 * O portão é a exceção 2 de `docs/fcp.md`: decide se o editor existe, então o
 * esqueleto cobre o editor inteiro. O catálogo de campos globais sai em
 * `prefetch` antes do portão, então as duas esperas correm juntas.
 */
export default function CriarModeloFichaPage({
    searchParams,
}: {
    /**
     * `evento`, `modalidade` e `categoria` chegam do seletor de ficha de uma
     * categoria: o modelo criado é vinculado a ela, e o editor volta para lá.
     */
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const categoria = lerCategoriaDeOrigem(use(searchParams));

    void prefetch(trpc.fichaAvaliativa.getCamposGlobais.queryOptions());

    return (
        <Suspense fallback={<EditorModeloFichaSkeleton />}>
            <PortaoDaEntidade>
                <EditorComCatalogo categoria={categoria} />
            </PortaoDaEntidade>
        </Suspense>
    );
}

/**
 * O editor espera o catálogo inteiro: uma posição global sem o seu campo não
 * tem o que desenhar. Fica atrás do mesmo `Suspense` do portão, cujo
 * esqueleto já cobre o editor todo.
 */
async function EditorComCatalogo({
    categoria,
}: {
    categoria: CategoriaDeOrigem | undefined;
}) {
    const camposGlobais = await getQueryClient().fetchQuery(
        trpc.fichaAvaliativa.getCamposGlobais.queryOptions(),
    );

    return (
        <EditorModeloFicha
            camposGlobais={camposGlobais}
            categoria={categoria}
        />
    );
}
