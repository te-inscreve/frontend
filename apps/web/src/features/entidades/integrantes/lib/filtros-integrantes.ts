import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    idadeEm,
    matriculaVencida,
    nomeCompleto,
} from "~/features/entidades/shared/integrantes";

/**
 * Os recortes da listagem.
 *
 * A listagem de `/minha-entidade/integrantes` ainda não aceita parâmetros, e
 * por isso quem recorta é o navegador: na tela de integrantes o filtro é só
 * estado, e na coluna da tela de grupos ele passa pelo
 * {@link filtrarIntegrantes} sobre as páginas já carregadas. Quando o backend
 * aceitar, o que muda é o hook passar estes campos ao `integrante.list` — a UI
 * já está pronta.
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

/**
 * Aplica o recorte sobre uma lista já carregada.
 *
 * Serve a quem filtra no navegador, e não na API: hoje é a coluna de
 * integrantes da tela de grupos, que precisa achar uma pessoa para incluir no
 * grupo sem recarregar nada. A listagem de `/minha-entidade/integrantes` ainda
 * não aceita parâmetros, então o recorte vale para o que já chegou — as páginas
 * seguintes entram no filtro à medida que a rolagem as pede.
 *
 * O nome é comparado sem caixa e sem depender de onde o trecho aparece: quem
 * digita "silva" acha "Ana Silva" pelo sobrenome.
 */
export function filtrarIntegrantes<
    T extends Pick<
        Integrante,
        "nome" | "sobrenome" | "dataNascimento" | "validade"
    >,
>(integrantes: T[], filtros: FiltrosIntegrantes): T[] {
    const procurado = filtros.nome.trim().toLowerCase();

    return integrantes.filter((integrante) => {
        if (
            procurado !== "" &&
            !nomeCompleto(integrante).toLowerCase().includes(procurado)
        ) {
            return false;
        }

        if (filtros.somenteVencidas && !matriculaVencida(integrante)) {
            return false;
        }

        const idade = idadeEm(integrante.dataNascimento);
        if (filtros.idadeMinima !== null && idade < filtros.idadeMinima) {
            return false;
        }
        if (filtros.idadeMaxima !== null && idade > filtros.idadeMaxima) {
            return false;
        }

        return true;
    });
}
