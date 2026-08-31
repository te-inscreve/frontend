"use client";

import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";

import type { ModalidadeCamposValues } from "./modalidade-form-schema";
import { CampoNumero } from "~/shared/ui/form/campo-numero";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import { DescricaoField } from "./fields/descricao-field";
import { IsGrupoField } from "./fields/is-grupo-field";
import { PlanilhaAbertaField } from "./fields/planilha-aberta-field";

/**
 * Os campos da modalidade em si, sem as categorias.
 *
 * Vivem separados do formulário porque as duas telas os mostram iguais: a
 * criação, na primeira aba, e a edição, sozinhos na página. Os tipos apontam
 * para {@link ModalidadeCamposValues}, o pedaço comum aos dois formulários.
 */
export function CamposModalidade() {
    return (
        <>
            <CampoTexto<ModalidadeCamposValues>
                name="nome"
                label="Nome da modalidade"
                placeholder="Ex.: Dança de salão"
            />
            <DescricaoField />
            <div className="flex flex-col flex-nowrap gap-3 md:flex-row">
                <CampoNumero<ModalidadeCamposValues>
                    name="maxPosicaoPremiada"
                    label={
                        <div className="flex items-center gap-1">
                            <TrophyIcon size={16} />
                            Posições premiadas
                        </div>
                    }
                    opcional
                    placeholder="Sem premiação"
                    ajuda="Até que colocação a modalidade premia. Use 0 para não premiar."
                />
                <CampoNumero<ModalidadeCamposValues>
                    name="maxInscricoesEntidadePorCategoria"
                    label={
                        <div className="flex items-center gap-1">
                            <TicketIcon size={16} />
                            Inscrições por entidade
                        </div>
                    }
                    opcional
                    min={1}
                    placeholder="Quantidade ilimitada"
                    ajuda="Deixe vazio para não limitar as inscrições de uma entidade."
                />
            </div>
            <PlanilhaAbertaField />
            <IsGrupoField />
        </>
    );
}
