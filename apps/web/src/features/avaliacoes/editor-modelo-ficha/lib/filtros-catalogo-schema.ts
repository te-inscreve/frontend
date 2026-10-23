import { z } from "zod/v4";

import { tipoCampoFichaSchema } from "@te-inscreve/schemas";

/**
 * Os recortes do catálogo de campos prontos que não cabem na barra. O nome
 * fica na busca; aqui entra o tipo do campo.
 */
export const filtrosCatalogoSchema = z.object({
    /** `null` mostra todos os tipos. */
    tipo: tipoCampoFichaSchema.nullable(),
});

export type FiltrosCatalogo = z.infer<typeof filtrosCatalogoSchema>;

export const filtrosCatalogoVazios: FiltrosCatalogo = { tipo: null };
