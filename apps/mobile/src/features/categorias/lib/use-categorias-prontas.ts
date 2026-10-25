import { useQuery } from "@tanstack/react-query";

import { listarCategoriasProntas } from "./listar-categorias-prontas";

/** A consulta da lista de categorias, também lida fora dela (a ficha). */
export const categoriasProntasQuery = {
    queryKey: ["categorias-prontas"],
    queryFn: listarCategoriasProntas,
};

export function useCategoriasProntas() {
    return useQuery(categoriasProntasQuery);
}
