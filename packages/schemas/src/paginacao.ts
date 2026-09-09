import type { z } from "zod/v4";
import { z as zod } from "zod/v4";

/**
 * O envelope que o backend devolve em toda listagem paginada:
 *
 * ```json
 * { "page": 1, "pageSize": 20, "totalPages": 3, "totalItems": 41, "items": [] }
 * ```
 *
 * É genérico porque o formato é o mesmo para qualquer recurso — só o item
 * muda. Quem lista integrantes hoje, e grupos amanhã, monta o schema da
 * página a partir do schema do item.
 */
export const paginadoSchema = <T extends z.ZodType>(item: T) =>
    zod.object({
        page: zod.number().int().positive(),
        pageSize: zod.number().int().positive(),
        totalPages: zod.number().int().nonnegative(),
        totalItems: zod.number().int().nonnegative(),
        items: zod.array(item),
    });

export interface Paginado<T> {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    items: T[];
}

/**
 * A próxima página a pedir, ou `undefined` quando a última já chegou.
 *
 * É o `getNextPageParam` das queries infinitas. Mora aqui, e não em cada
 * hook, para a página que faz o prefetch no servidor e o hook que rola no
 * cliente lerem o mesmo critério.
 */
export const proximaPagina = (ultima: Paginado<unknown>) =>
    ultima.page < ultima.totalPages ? ultima.page + 1 : undefined;
