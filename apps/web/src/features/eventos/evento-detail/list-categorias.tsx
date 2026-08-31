import type { CategoriaAninhada } from "@te-inscreve/schemas";

import { HorizontalScrollList } from "~/shared/ui/horizontal-scroll-list";
import { BotaoCriarCategoria } from "./botao-criar-categoria";
import { CardCategoria } from "./card-categoria";

interface Props {
    eventoId: number;
    modalidadeId: number;
    /** Nome da modalidade, usado só para rotular a lista. */
    modalidadeNome: string;
    categorias: CategoriaAninhada[];
}

/**
 * Fila de categorias da modalidade aberta, com o atalho de criar como último
 * item — assim ele acompanha os cartões em vez de flutuar acima deles, e
 * continua à vista quando ainda não há categoria nenhuma.
 *
 * As categorias chegam prontas de `modalidade.getById`: aqui não se busca nada.
 */
export function ListCategorias({
    eventoId,
    modalidadeId,
    modalidadeNome,
    categorias,
}: Props) {
    return (
        <HorizontalScrollList label={`Categorias de ${modalidadeNome}`}>
            {categorias.map((categoria) => (
                // As categorias aninhadas não trazem `id`, e o nome é único
                // dentro de uma modalidade.
                <CardCategoria
                    key={categoria.nome}
                    categoria={categoria}
                    eventoId={eventoId}
                    modalidadeId={modalidadeId}
                />
            ))}
            <BotaoCriarCategoria
                eventoId={eventoId}
                modalidadeId={modalidadeId}
                sozinho={categorias.length === 0}
            />
        </HorizontalScrollList>
    );
}
