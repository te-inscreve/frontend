"use client";

import { addYears, startOfDay } from "date-fns";

import type { CategoriaFormValues } from "./categoria-form-schema";
import { CampoData } from "~/shared/ui/form/campo-data";
import { CampoNumero } from "~/shared/ui/form/campo-numero";
import { CampoTexto } from "~/shared/ui/form/campo-texto";

/**
 * Primeiro e último instante do evento, em ISO — como a API os devolve. Strings
 * e não `Date` porque atravessam a fronteira do Server Component.
 */
export interface PeriodoEvento {
    inicio: string;
    fim: string;
}

interface Props {
    /**
     * Com o período, o calendário da apresentação só aceita os dias do evento
     * e abre no mês em que ele começa. Sem ele, qualquer dia vale.
     */
    periodoEvento?: PeriodoEvento;
}

/**
 * Os campos da categoria, sem nenhum invólucro: a página os põe dentro de um
 * `Card`, o diálogo os põe direto no corpo do modal.
 *
 * Ficam separados porque são o único pedaço que os dois compartilham — o
 * cabeçalho, a trilha e o rodapé de cada um são diferentes por natureza.
 *
 * Lê o formulário do contexto (`FormProvider`), então quem chama já precisa
 * estar dentro de um.
 */
export function CamposCategoria({ periodoEvento }: Props) {
    // `startOfDay` porque o início guarda um horário: o dia em que o evento
    // começa precisa continuar escolhível.
    const inicio = periodoEvento
        ? startOfDay(new Date(periodoEvento.inicio))
        : undefined;
    const fim = periodoEvento ? new Date(periodoEvento.fim) : undefined;

    return (
        <div className="grid gap-4 sm:grid-cols-6">
            <CampoTexto<CategoriaFormValues>
                name="nome"
                label="Nome da categoria"
                placeholder="Ex.: Juvenil feminino"
                className="col-span-3"
            />
            <CampoNumero<CategoriaFormValues>
                name="maxInscricoes"
                label="Limite de inscrições"
                opcional
                min={1}
                placeholder="Sem limite"
                className="col-span-3"
            />

            <CampoNumero<CategoriaFormValues>
                name="idadeMinima"
                label="Idade mínima"
                placeholder="Ex.: 12"
                className="col-span-3"
            />
            <CampoNumero<CategoriaFormValues>
                name="idadeMaxima"
                label="Idade máxima"
                placeholder="Ex.: 17"
                className="col-span-3"
            />

            <CampoData<CategoriaFormValues>
                name="diaApresentacao"
                label="Dia da apresentação"
                opcional
                mesInicial={inicio}
                dataMinima={inicio}
                // Sem limite superior o calendário não passa do fim do ano
                // corrente — e há evento cadastrado com mais antecedência.
                dataMaxima={fim ?? addYears(new Date(), 2)}
                className="col-span-4"
            />
            <CampoTexto<CategoriaFormValues>
                name="horaApresentacao"
                label="Horário"
                type="time"
                className="col-span-2 self-start"
            />
        </div>
    );
}
