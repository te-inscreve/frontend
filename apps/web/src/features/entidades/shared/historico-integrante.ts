/**
 * A vida do integrante fora do cadastro: os grupos de que ele faz parte e as
 * categorias em que já se inscreveu.
 *
 * Nada disso existe na API ainda — nem o recurso de integrante existe. Este
 * arquivo é o mock que sustenta o detalhe da pessoa até os endpoints chegarem,
 * e é separado de `integrantes.ts` justamente para ser fácil de apagar inteiro
 * quando isso acontecer: o que sobreviver vira consulta, não constante.
 *
 * O mock é **derivado do id**, e não sorteado. Sorteio mudaria a cada
 * renderização, e o detalhe de uma pessoa passaria a contar uma história
 * diferente toda vez que o modal abrisse.
 */

import type { Integrante } from "./integrantes";
import { dataDeISO, idadeEm } from "./integrantes";

/** Grupo artístico de que o integrante participa. */
export interface GrupoDoIntegrante {
    id: string;
    nome: string;
    modalidade: string;
    /** Verdadeiro para o grupo que a pessoa puxa — muda o peso na lista. */
    responsavel: boolean;
}

/** Uma inscrição que já aconteceu, com o resultado que ela teve. */
export interface InscricaoPassada {
    id: string;
    ano: number;
    evento: string;
    modalidade: string;
    categoria: string;
    resultado: Resultado;
}

export type Resultado = "premiado" | "classificado" | "participou";

export const ROTULO_RESULTADO: Record<Resultado, string> = {
    premiado: "Premiado",
    classificado: "Classificado",
    participou: "Participou",
};

/**
 * O mock é congelado neste ano de propósito: derivar as datas do relógio faria
 * o histórico mudar sozinho na virada do ano e tornaria a tela impura.
 */
const ANO_BASE = 2025;

/**
 * As listas são tipadas como tupla não-vazia — e não `as const` — porque é
 * disso que o `escolher` tira a garantia de sempre devolver um item, sem `!`.
 */
type NaoVazia<T> = readonly [T, ...T[]];

const GRUPOS: NaoVazia<{ nome: string; modalidade: string }> = [
    { nome: "Invernada Artística Adulta", modalidade: "Danças Tradicionais" },
    { nome: "Invernada Mirim", modalidade: "Danças Tradicionais" },
    { nome: "Invernada Juvenil", modalidade: "Danças Tradicionais" },
    { nome: "Grupo de Gaiteiros", modalidade: "Música" },
    { nome: "Conjunto Vocal", modalidade: "Música" },
    { nome: "Piquete de Chula", modalidade: "Chula" },
];

const EVENTOS: NaoVazia<string> = [
    "Rodeio Internacional de Vacaria",
    "Festival Estadual do Chimarrão",
    "ENART — Encontro de Arte e Tradição",
    "Rodeio Crioulo de Caxias do Sul",
    "Festival Farroupilha da 24ª RT",
];

const RESULTADOS: NaoVazia<Resultado> = [
    "participou",
    "classificado",
    "premiado",
];

/**
 * Escolhe um item da lista a partir do id, espalhado o suficiente para dois
 * integrantes seguidos não caírem sempre no mesmo.
 */
function escolher<T>(lista: NaoVazia<T>, id: number, posicao: number): T {
    return lista[(id * 7 + posicao * 5) % lista.length] ?? lista[0];
}

/** Os grupos do integrante. Alguns não têm nenhum — a tela precisa mostrar isso. */
export function gruposDoIntegrante(
    integrante: Integrante,
): GrupoDoIntegrante[] {
    // Um a cada quatro fica sem grupo: é o estado vazio, e ele existe de
    // verdade em entidade que acabou de cadastrar as pessoas.
    if (integrante.id % 4 === 0) return [];

    const quantidade = 1 + (integrante.id % 2);

    return Array.from({ length: quantidade }, (_, posicao) => {
        const grupo = escolher(GRUPOS, integrante.id, posicao);

        return {
            id: `${integrante.id}-${posicao}`,
            nome: grupo.nome,
            modalidade: grupo.modalidade,
            // Quem instrui ou é patrão/prenda responde pelo primeiro grupo.
            responsavel:
                posicao === 0 &&
                (integrante.funcao === "instrutor" ||
                    integrante.funcao === "patrao-prenda"),
        };
    });
}

/**
 * As inscrições passadas, da mais recente para a mais antiga.
 *
 * A categoria acompanha a idade que a pessoa tinha **naquele ano**, e não a de
 * hoje: é assim que a faixa etária funciona, e um histórico que ignorasse isso
 * colocaria adulto na categoria mirim.
 */
export function inscricoesDoIntegrante(
    integrante: Integrante,
): InscricaoPassada[] {
    const quantidade = (integrante.id * 3) % 4;

    return Array.from({ length: quantidade }, (_, posicao) => {
        const ano = ANO_BASE - posicao;
        const grupo = escolher(GRUPOS, integrante.id, posicao);
        const idadeNaEpoca = idadeEm(
            integrante.dataNascimento,
            dataDeISO(`${ano}-09-20`),
        );

        return {
            id: `${integrante.id}-${ano}`,
            ano,
            evento: escolher(EVENTOS, integrante.id, posicao),
            modalidade: grupo.modalidade,
            categoria: faixaEtaria(idadeNaEpoca),
            resultado: escolher(RESULTADOS, integrante.id, posicao),
        };
    });
}

/**
 * A faixa etária da categoria em que a pessoa cabia — os mesmos cortes que o
 * cadastro de categoria monta com idade mínima e máxima.
 */
function faixaEtaria(idade: number): string {
    if (idade <= 12) return "Mirim";
    if (idade <= 16) return "Juvenil";
    if (idade <= 29) return "Adulta";
    return "Veterana";
}
