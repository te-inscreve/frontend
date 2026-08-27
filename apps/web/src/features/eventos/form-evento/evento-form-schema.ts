import { z } from "zod/v4";

import type { Evento } from "@te-inscreve/schemas";

/**
 * Espelha o `createEventoSchema` de `@te-inscreve/schemas` (a fonte de verdade
 * do que cruza a borda REST), mas na forma que a UI manipula: as datas vivem
 * como intervalos, que é o que o calendário devolve, e os arquivos podem ser
 * um `File` ainda por subir ou a URL do que o backend já guarda.
 */

/**
 * Um intervalo em edição. Entre o primeiro e o segundo clique no calendário só
 * existe o início, então os dois lados são opcionais até a validação.
 */
export interface Periodo {
    from: Date | undefined;
    to: Date | undefined;
}

/**
 * Um arquivo do evento: o `File` recém-escolhido, a URL do que já está salvo
 * (só na edição) ou nada. A URL é lida como "manter o que está lá" — ela não
 * volta para o backend no salvamento.
 */
const arquivo = z.custom<File | string>().nullable();

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
    logo: arquivo,
    cartaz: arquivo,
    regulamento: arquivo,
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
 * Data vinda da API, ou `undefined` quando ela falta ou não é interpretável.
 *
 * Uma `Invalid Date` é um objeto e passaria por qualquer teste de presença,
 * estourando lá na frente no formatador; ausente, o campo apenas volta vazio e
 * o formulário cobra o preenchimento como cobraria em um evento novo.
 */
function dataOuVazio(valor: string | undefined): Date | undefined {
    if (!valor) return undefined;

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? undefined : data;
}

/**
 * Preenche o formulário com um evento que já existe. É o caminho inverso do
 * {@link eventoFormData}: as datas voltam a ser intervalos e os arquivos
 * viram as URLs salvas, que os campos mostram como pré-visualização.
 */
export function eventoFormValues(evento: Evento): EventoFormValues {
    return {
        nome: evento.nome,
        descricao: evento.descricao,
        local: evento.local,
        unico: evento.unico,
        // O backend não devolve um `publicado`: quem ainda está `em-preparacao`
        // é rascunho, e qualquer outra situação já saiu para o público.
        publicado: Boolean(
            evento.situacao && evento.situacao !== "em-preparacao",
        ),
        periodoEvento: {
            from: dataOuVazio(evento.dataInicio),
            to: dataOuVazio(evento.dataFim),
        },
        periodoInscricoes: {
            from: dataOuVazio(evento.dataInicioInscricoes),
            to: dataOuVazio(evento.dataFimInscricoes),
        },
        logo: evento.logo ?? null,
        cartaz: evento.cartaz ?? null,
        regulamento: evento.regulamento ?? null,
    };
}

/**
 * Converte o modelo de edição validado para o multipart consumido pela rota
 * tRPC. Manter a conversão junto do schema evita que o componente replique o
 * contrato das datas ou esqueça algum arquivo ao enviar o formulário.
 *
 * Com `id`, o multipart é o da edição — a rota `update` tira o campo do corpo
 * antes de repassar ao backend.
 */
export function eventoFormData(
    valores: EventoFormValues,
    id?: number,
): FormData {
    const dados = eventoFormSchema.parse(valores);
    const inicioEvento = dados.periodoEvento.from;
    const fimEvento = dados.periodoEvento.to;
    const inicioInscricoes = dados.periodoInscricoes.from;
    const fimInscricoes = dados.periodoInscricoes.to;

    // As refinements acima garantem os quatro valores. O guard mantém essa
    // invariável explícita para o TypeScript e protege chamadas fora do RHF.
    if (!inicioEvento || !fimEvento || !inicioInscricoes || !fimInscricoes) {
        throw new Error("Os períodos do evento ainda estão incompletos.");
    }

    const formData = new FormData();
    formData.set("nome", dados.nome);
    formData.set("descricao", dados.descricao);
    formData.set("local", dados.local);
    formData.set("unico", String(dados.unico));
    formData.set("publicado", String(dados.publicado));
    formData.set("dataInicio", inicioEvento.toISOString());
    formData.set("dataFim", fimEvento.toISOString());
    formData.set("dataInicioInscricoes", inicioInscricoes.toISOString());
    formData.set("dataFimInscricoes", fimInscricoes.toISOString());

    // Só arquivo novo sobe. Um valor em texto é a URL do que já está salvo, e
    // reenviá-la faria o backend tentar guardar a URL no lugar do arquivo.
    if (dados.logo instanceof File) formData.set("logo", dados.logo);
    if (dados.cartaz instanceof File) formData.set("cartaz", dados.cartaz);
    if (dados.regulamento instanceof File) {
        formData.set("regulamento", dados.regulamento);
    }

    if (id !== undefined) formData.set("id", String(id));

    return formData;
}

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
