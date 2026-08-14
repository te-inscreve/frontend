import { z } from "zod/v4";

/**
 * Espelha o `createEventoSchema` de `@te-inscreve/schemas` (a fonte de verdade
 * do que cruza a borda REST), mas na forma que a UI manipula: as datas vivem
 * como intervalos, que é o que o calendário devolve, e os arquivos ainda são
 * `File` — só depois do upload viram as URLs que o backend guarda.
 */

/**
 * Um intervalo em edição. Entre o primeiro e o segundo clique no calendário só
 * existe o início, então os dois lados são opcionais até a validação.
 */
export interface Periodo {
    from: Date | undefined;
    to: Date | undefined;
}

const periodo = (mensagem: string) =>
    z.custom<Periodo>().refine(({ from, to }) => Boolean(from && to), {
        error: mensagem,
    });

export const eventoFormSchema = z.object({
    nome: z.string().trim().min(1, "Informe o nome do evento."),
    descricao: z.string().trim().min(1, "Escreva uma descrição do evento."),
    local: z.string().trim().min(1, "Informe onde o evento acontece."),
    unico: z.boolean(),
    publicado: z.boolean(),
    periodoEvento: periodo("Selecione as datas de início e fim do evento."),
    periodoInscricoes: periodo("Selecione o período de inscrições."),
    logo: z.custom<File>().nullable(),
    cartaz: z.custom<File>().nullable(),
    regulamento: z.custom<File>().nullable(),
});

export type EventoFormValues = z.infer<typeof eventoFormSchema>;

export const eventoFormDefaults: EventoFormValues = {
    nome: "",
    descricao: "",
    local: "",
    unico: true,
    publicado: false,
    periodoEvento: { from: undefined, to: undefined },
    periodoInscricoes: { from: undefined, to: undefined },
    logo: null,
    cartaz: null,
    regulamento: null,
};

/**
 * Inscrições que fecham depois do evento começar. É um aviso, não um erro: há
 * eventos que aceitam inscrição no local, então o organizador decide.
 */
export function inscricoesFechamDepoisDoInicio(
    periodoEvento: Periodo,
    periodoInscricoes: Periodo,
): boolean {
    const { from: inicioEvento } = periodoEvento;
    const { to: fimInscricoes } = periodoInscricoes;

    return Boolean(
        inicioEvento && fimInscricoes && fimInscricoes > inicioEvento,
    );
}
