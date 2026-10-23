"use client";

import type { EntidadeFormValues } from "./entidade-form-schema";
import { CampoSelect } from "~/shared/ui/form/campo-select";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import { formatCnpj } from "~/shared/utils/format-cnpj";
import { maskTelefone } from "~/shared/utils/format-telefone";
import { estados } from "./entidade-form-schema";

/**
 * Os campos do cadastro da entidade, sem invólucro: quem dá título e moldura é
 * o modal que os contém.
 *
 * Lê o formulário do contexto (`FormProvider`), então quem chama já precisa
 * estar dentro de um.
 */
export function CamposEntidade() {
    return (
        <div className="grid gap-4 sm:grid-cols-6">
            <CampoTexto<EntidadeFormValues>
                name="nome"
                label="Nome da entidade"
                placeholder="Ex.: CTG Porteira do Rio Grande"
                className="col-span-6"
            />

            <CampoTexto<EntidadeFormValues>
                name="cnpj"
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                mask={formatCnpj}
                className="col-span-3"
            />
            <CampoTexto<EntidadeFormValues>
                name="telefone"
                label="Telefone"
                placeholder="(00) 00000-0000"
                inputMode="tel"
                mask={maskTelefone}
                className="col-span-3"
            />

            <CampoTexto<EntidadeFormValues>
                name="cidade"
                label="Cidade"
                placeholder="Ex.: Vacaria"
                className="col-span-4"
            />
            <CampoSelect<EntidadeFormValues>
                name="estado"
                label="Estado"
                opcoes={estados}
                placeholder="UF"
                className="col-span-2"
            />
        </div>
    );
}
