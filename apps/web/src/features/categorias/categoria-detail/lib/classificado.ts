import type { ResultadoCategoria } from "@te-inscreve/schemas";

/**
 * Quem se apresentou: a pessoa na individual; na em grupo, o nome de
 * concorrente ou, sem ele, a própria entidade.
 */
export function nomeDoClassificado(resultado: ResultadoCategoria) {
    if (resultado.concorrente) {
        return `${resultado.concorrente.nome} ${resultado.concorrente.sobrenome}`;
    }
    if (resultado.nomeConcorrente) return resultado.nomeConcorrente;
    // `concorrente: null` é a individual sem integrante; sem a chave, é grupo.
    return resultado.concorrente === null
        ? "Concorrente não informado"
        : resultado.nomeEntidade;
}
