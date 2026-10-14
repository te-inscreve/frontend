import { EditorModeloFicha } from "~/features/avaliacoes/editor-modelo-ficha/editor-modelo-ficha";
import { camposGlobaisMock } from "~/features/avaliacoes/editor-modelo-ficha/lib/campos-globais-mock";

export const metadata = {
    title: "Novo modelo de ficha | Te Inscreve",
    description: "Montagem de um modelo de ficha avaliativa da entidade",
};

/**
 * Sem espera: o catálogo de campos globais ainda é um mock local. Quando virar
 * query, ele desce para um filho suspenso, como manda `docs/fcp.md`.
 */
export default function CriarModeloFichaPage() {
    return <EditorModeloFicha camposGlobais={camposGlobaisMock} />;
}
