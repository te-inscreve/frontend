"use client";

import type { CategoriaFormValues } from "./categoria-form-schema";
import { CampoNumero } from "~/shared/ui/form/campo-numero";
import { CampoTexto } from "~/shared/ui/form/campo-texto";

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
export function CamposCategoria() {
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
        </div>
    );
}
