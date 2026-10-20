import { Suspense, use } from "react";

import { EditorModeloFicha } from "~/features/avaliacoes/editor-modelo-ficha/editor-modelo-ficha";
import { EditorModeloFichaSkeleton } from "~/features/avaliacoes/editor-modelo-ficha/editor-modelo-ficha-skeleton";
import { camposGlobaisMock } from "~/features/avaliacoes/editor-modelo-ficha/lib/campos-globais-mock";
import { lerCategoriaDeOrigem } from "~/features/avaliacoes/ficha-avaliativa/lib/categoria-de-origem";
import { PortaoDaEntidade } from "~/features/entidades/solicitar-acesso/portao-da-entidade";

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
 * esqueleto cobre o editor inteiro. O catálogo de campos globais ainda é um
 * mock local; quando virar query, o `prefetch` dele entra aqui, antes do
 * portão.
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

    return (
        <Suspense fallback={<EditorModeloFichaSkeleton />}>
            <PortaoDaEntidade>
                <EditorModeloFicha
                    camposGlobais={camposGlobaisMock}
                    categoria={categoria}
                />
            </PortaoDaEntidade>
        </Suspense>
    );
}
