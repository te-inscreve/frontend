import type {
    CampoFicha,
    ModificadorNota,
    TipoCampoFicha,
} from "@te-inscreve/schemas";
import { aceitaAlternativas } from "@te-inscreve/schemas";

import type { CampoExclusivoForm } from "./modelo-ficha-form-schema";

/**
 * Um campo como a tela o desenha — na miniatura, na lista do editor e na
 * prévia —, venha ele do catálogo global ou do formulário.
 */
export interface CampoExibido {
    nome: string;
    descricao: string;
    tipo: TipoCampoFicha;
    obrigatorio: boolean;
    /** O teto já pronto para ler: `"0.5000"` vira `"0,5"`. */
    teto: string | null;
    modificadorNota: ModificadorNota | null;
    alternativas: string[];
}

export function exibirCampoGlobal(campo: CampoFicha): CampoExibido {
    return {
        nome: campo.nome,
        descricao: campo.descricao,
        tipo: campo.tipo,
        obrigatorio: campo.obrigatorio,
        teto: formatarTeto(campo.valorMaximo ?? ""),
        modificadorNota: campo.modificadorNota ?? null,
        alternativas: (campo.alternativas ?? []).map(
            (alternativa) => alternativa.nome,
        ),
    };
}

export function exibirCampoExclusivo(campo: CampoExclusivoForm): CampoExibido {
    return {
        nome: campo.nome.trim() || "Campo sem nome",
        descricao: campo.descricao,
        tipo: campo.tipo,
        obrigatorio: campo.obrigatorio,
        teto:
            campo.tipo === "NUMERICO" ? formatarTeto(campo.valorMaximo) : null,
        modificadorNota:
            campo.tipo === "NUMERICO" ? campo.modificadorNota : null,
        alternativas: aceitaAlternativas(campo.tipo)
            ? campo.alternativas.map(
                  (alternativa, indice) =>
                      alternativa.nome.trim() || `Alternativa ${indice + 1}`,
              )
            : [],
    };
}

/** Decimal do backend ou o que foi digitado, sem os zeros à direita. */
function formatarTeto(valor: string): string | null {
    const numero = Number(valor.trim().replace(",", "."));
    if (valor.trim() === "" || Number.isNaN(numero)) return null;
    return numero.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

export const ROTULO_TIPO: Record<TipoCampoFicha, string> = {
    NUMERICO: "Numérico",
    ALTERNATIVA_UNICA: "Alternativa única",
    ALTERNATIVA_MULTIPLA: "Alternativa múltipla",
    DESCRITIVO: "Descritivo",
    OBSERVACAO: "Observação",
};

export const ROTULO_MODIFICADOR: Record<ModificadorNota, string> = {
    SOMA: "Soma",
    DESCONTA: "Subtrai",
};
