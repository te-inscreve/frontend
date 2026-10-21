import { useQuery } from "@tanstack/react-query";

import { listarCategoriasProntas } from "./listar-categorias-prontas";

export function useCategoriasProntas() {
    return useQuery({
        queryKey: ["categorias-prontas"],
        queryFn: listarCategoriasProntas,
    });
}
