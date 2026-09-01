import type {
    FuncaoIntegrante,
    Integrante,
} from "~/features/entidades/shared/integrantes";
import { dataDeISO } from "~/features/entidades/shared/integrantes";

/**
 * Os três recortes da listagem. Ficam num módulo próprio, separados do
 * componente, porque a regra de quem entra no resultado é a mesma quando os
 * dados vierem da API — só muda quem a executa, cliente ou servidor.
 */
export interface FiltrosIntegrantes {
    /** Trecho do nome. Vazio não filtra nada. */
    nome: string;
    /** Intervalo de nascimento; cada ponta filtra sozinha. */
    nascimentoDe: Date | null;
    nascimentoAte: Date | null;
    funcao: FuncaoIntegrante | null;
}

export const filtrosVazios: FiltrosIntegrantes = {
    nome: "",
    nascimentoDe: null,
    nascimentoAte: null,
    funcao: null,
};

export function temFiltroAtivo(filtros: FiltrosIntegrantes): boolean {
    return (
        filtros.nome.trim() !== "" ||
        filtros.nascimentoDe !== null ||
        filtros.nascimentoAte !== null ||
        filtros.funcao !== null
    );
}

/** Ignora acento e caixa: quem procura "otavio" quer achar "Otávio". */
function normalizar(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}

/** Meia-noite do dia: as pontas do intervalo incluem o próprio dia. */
function inicioDoDia(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function filtrarIntegrantes(
    integrantes: Integrante[],
    filtros: FiltrosIntegrantes,
): Integrante[] {
    const busca = normalizar(filtros.nome.trim());
    const de = filtros.nascimentoDe && inicioDoDia(filtros.nascimentoDe);
    const ate = filtros.nascimentoAte && inicioDoDia(filtros.nascimentoAte);

    return integrantes.filter((integrante) => {
        if (busca && !normalizar(integrante.nome).includes(busca)) return false;

        if (filtros.funcao && integrante.funcao !== filtros.funcao) {
            return false;
        }

        const nascimento = dataDeISO(integrante.dataNascimento);
        if (de && nascimento < de) return false;
        if (ate && nascimento > ate) return false;

        return true;
    });
}
