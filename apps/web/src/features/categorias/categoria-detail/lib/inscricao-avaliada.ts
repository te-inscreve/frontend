import type { InscricaoAvaliada } from "@te-inscreve/schemas";

/**
 * Quem se apresentou na inscrição avaliada, na mesma regra da classificação:
 * a pessoa na individual; na em grupo, o nome de concorrente ou, sem ele, a
 * própria entidade.
 */
export function nomeDaInscricaoAvaliada(inscricao: InscricaoAvaliada) {
    if (inscricao.concorrente) {
        return `${inscricao.concorrente.nome} ${inscricao.concorrente.sobrenome}`;
    }
    if (inscricao.nomeConcorrente) return inscricao.nomeConcorrente;
    // `concorrente: null` é a individual sem integrante; sem a chave, é grupo.
    return inscricao.concorrente === null
        ? "Concorrente não informado"
        : inscricao.entidade.nome;
}
