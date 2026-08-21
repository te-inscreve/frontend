import type { DetalheEvento } from "~/app/admin/eventos/[slug]/mock";
import { HorizontalScrollList } from "~/shared/ui/horizontal-scroll-list";
import { CardCategoria } from "./card-categoria";

type Modalidade = DetalheEvento["modalidades"][number];

interface Props {
    modalidade: Modalidade;
}

export function ListCategorias({ modalidade }: Props) {
    return (
        <HorizontalScrollList
            label={`Categorias de ${modalidade.nome}`}
            emptyState={
                <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
                    Esta modalidade ainda não tem categorias. Crie a primeira
                    para abrir inscrições.
                </p>
            }
        >
            {modalidade.categorias.map((categoria) => (
                <CardCategoria key={categoria.nome} categoria={categoria} />
            ))}
        </HorizontalScrollList>
    );
}
