/**
 * O grupo da entidade: o que ele é, como a API o devolve e as contas que a
 * tela faz em cima dele.
 *
 * Grupo é um conjunto de integrantes montado só para organização. Ele não
 * pertence a modalidade nenhuma — quem amarra grupo e modalidade é a inscrição,
 * que manda o grupo para o backend saber quem relacionar na ficha.
 *
 * Os tipos abaixo são os do backend (`/minha-entidade/grupos`), já em
 * camelCase: `GrupoListSerializer` para a listagem e `GrupoDetailSerializer`
 * para o detalhe, que é o único que traz os integrantes. Enquanto a rota tRPC
 * não existe, os dados saem de `mock-grupos.ts` — ver o comentário de lá. Quando
 * existir, estes tipos viram schema em `packages/schemas`.
 */

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { matriculaVencida } from "~/features/entidades/shared/integrantes";

/** O grupo como vem na listagem: o resumo, sem a formação. */
export interface Grupo {
    id: number;
    nome: string;
    /** Para que o grupo serve. Pode vir vazia — o backend não a exige. */
    descricao: string;
    totalIntegrantes: number;
    /** Criação em ISO com hora (`DateTimeField`), e não a data seca. */
    dataCriacao: string;
    /**
     * Se alguém do grupo está com a matrícula vencida. Vem pronta do backend
     * porque a listagem não carrega a formação, e sem ela a tela não teria como
     * descobrir — é o aviso de que a inscrição vai travar.
     */
    pendenciaCarteiraVencida: boolean;
}

/** O detalhe: o mesmo grupo com a formação inteira. */
export interface GrupoDetalhe extends Grupo {
    integrantes: Integrante[];
}

/** "1 integrante" / "N integrantes" — o plural do número que a tela mostra. */
export function contagemIntegrantes(total: number): string {
    return total === 1 ? "1 integrante" : `${total} integrantes`;
}

/**
 * A data de criação como `dd/mm/aaaa`.
 *
 * `new Date` aqui é seguro, ao contrário do que acontece com as datas secas
 * dos integrantes: este campo chega com hora e fuso, então não há meia-noite
 * UTC para o horário local empurrar para o dia anterior.
 */
export function formatarDataCriacao(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * Recalcula o resumo que o backend derivaria da formação.
 *
 * Existe porque a tela mexe na formação do grupo antes de qualquer ida à API:
 * incluir alguém com a matrícula vencida precisa acender o aviso na hora, e não
 * no próximo carregamento. Quando a rota tRPC existir, quem manda é a resposta
 * do `PATCH` — esta função sai junto com o mock.
 */
export function resumirFormacao(
    integrantes: Integrante[],
): Pick<Grupo, "totalIntegrantes" | "pendenciaCarteiraVencida"> {
    return {
        totalIntegrantes: integrantes.length,
        pendenciaCarteiraVencida: integrantes.some((integrante) =>
            matriculaVencida(integrante),
        ),
    };
}

/** O que o formulário de grupo envia — o corpo do `POST` e do `PATCH`. */
export interface FormGrupo {
    nome: string;
    descricao: string;
}

/**
 * Erro de regra que pertence a um campo do formulário, e não à tela inteira.
 *
 * O backend responde assim (`{"nome": ["..."]}` quando o nome repete dentro da
 * entidade), e o formulário de grupo sabe ler esta forma: a mensagem aparece
 * embaixo do campo em vez de virar um aviso genérico acima dos botões.
 */
export class ErroDeCampoGrupo extends Error {
    constructor(
        readonly campo: keyof FormGrupo,
        message: string,
    ) {
        super(message);
        this.name = "ErroDeCampoGrupo";
    }
}

/**
 * Dois grupos da mesma entidade não podem ter o mesmo nome — o backend tem a
 * restrição em banco (`grupo_nome_unico_por_entidade`), sem caixa e sem os
 * espaços das pontas.
 */
export function nomeRepetido(
    grupos: Grupo[],
    nome: string,
    /** O grupo em edição, que não conta como repetição de si mesmo. */
    ignorarId?: number,
): boolean {
    const procurado = nome.trim().toLowerCase();

    return grupos.some(
        (grupo) =>
            grupo.id !== ignorarId &&
            grupo.nome.trim().toLowerCase() === procurado,
    );
}
