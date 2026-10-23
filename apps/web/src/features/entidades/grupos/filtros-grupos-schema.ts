import { z } from "zod/v4";

/**
 * Os recortes da lista de grupos na inscrição, na forma que o formulário de
 * filtro manipula.
 *
 * Só dois por enquanto: o nome, que é o filtro de todo dia, e a pendência de
 * matrícula, que é o que trava a inscrição — o motivo de a lista existir
 * nesta tela.
 */
export const filtrosGruposSchema = z.object({
    /** Trecho do nome. Vazio não filtra nada. */
    nome: z.string(),
    /** Só grupos com alguém de matrícula vencida — os que não podem se inscrever. */
    somenteComPendencia: z.boolean(),
});

export type FiltrosGrupos = z.infer<typeof filtrosGruposSchema>;
