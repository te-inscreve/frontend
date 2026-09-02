import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    idadeEm,
    matriculaVencida,
} from "~/features/entidades/shared/integrantes";

/**
 * Os recortes da listagem. Ficam num módulo próprio, separados do componente,
 * porque a regra de quem entra no resultado é a mesma quando os dados vierem
 * da API — só muda quem a executa, cliente ou servidor.
 *
 * O recorte é por idade, e não por data de nascimento: a pergunta que a
 * entidade faz é "quem se enquadra na categoria", e categoria se define por
 * idade. Converter uma na outra é conta que ninguém deveria ter de fazer.
 */
export interface FiltrosIntegrantes {
    /** Trecho do nome. Vazio não filtra nada. */
    nome: string;
    /** Faixa de idade em anos completos; cada ponta filtra sozinha. */
    idadeMinima: number | null;
    idadeMaxima: number | null;
    /** Só quem está com a matrícula vencida — o que trava a inscrição. */
    somenteVencidas: boolean;
}

export const filtrosVazios: FiltrosIntegrantes = {
    nome: "",
    idadeMinima: null,
    idadeMaxima: null,
    somenteVencidas: false,
};

/** Os filtros que moram no diálogo — os que a barra não mostra sozinha. */
export function filtrosAvancadosAtivos(filtros: FiltrosIntegrantes): number {
    return [
        filtros.idadeMinima !== null,
        filtros.idadeMaxima !== null,
        filtros.somenteVencidas,
    ].filter(Boolean).length;
}

export function temFiltroAtivo(filtros: FiltrosIntegrantes): boolean {
    return filtros.nome.trim() !== "" || filtrosAvancadosAtivos(filtros) > 0;
}

/** Ignora acento e caixa: quem procura "otavio" quer achar "Otávio". */
function normalizar(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}

export function filtrarIntegrantes(
    integrantes: Integrante[],
    filtros: FiltrosIntegrantes,
): Integrante[] {
    const busca = normalizar(filtros.nome.trim());
    // Uma referência só para a lista inteira: com uma por pessoa, quem for
    // filtrado à meia-noite poderia ser medido em dias diferentes.
    const agora = new Date();

    return integrantes.filter((integrante) => {
        if (busca && !normalizar(integrante.nome).includes(busca)) return false;

        if (filtros.somenteVencidas && !matriculaVencida(integrante, agora)) {
            return false;
        }

        const idade = idadeEm(integrante.dataNascimento, agora);
        if (filtros.idadeMinima !== null && idade < filtros.idadeMinima) {
            return false;
        }
        if (filtros.idadeMaxima !== null && idade > filtros.idadeMaxima) {
            return false;
        }

        return true;
    });
}
