/**
 * Os recortes da listagem.
 *
 * Por ora o filtro é só estado: a listagem de `/minha-entidade/integrantes`
 * ainda não aceita parâmetros, então a barra e o diálogo guardam a escolha
 * sem recortar nada. Quando o backend aceitar, o que muda é o hook do painel
 * passar estes campos ao `integrante.list` — a UI já está pronta.
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
