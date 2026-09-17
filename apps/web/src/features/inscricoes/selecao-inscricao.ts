/**
 * O estado puro de uma inscrição sendo montada, e as regras que o movem.
 *
 * Uma inscrição diz quem se apresenta na categoria: um grupo (com quem do
 * grupo fica de fora) e/ou integrantes avulsos. Este arquivo não sabe de
 * React nem de API — é o que o hook (`use-inscricao.ts`) chama a cada clique,
 * e o que o ticket lê para se desenhar. Ficar puro é o que deixa as regras
 * testáveis de cabeça: cada função recebe a seleção e devolve a próxima.
 *
 * ## As regras
 *
 * - **Um grupo por inscrição.** Escolher outro grupo *substitui* o atual e
 *   zera as exclusões — elas eram sobre a formação do grupo anterior, e não
 *   fazem sentido sobre a nova. Os incluídos avulsos ficam: são escolhas
 *   sobre pessoas, não sobre o grupo.
 * - **O grupo vence.** Um incluído avulso que também é membro do grupo
 *   escolhido não aparece duas vezes no ticket nem vai em
 *   `integrantes_incluidos` — o backend já o relaciona pelo grupo. O registro
 *   continua em `incluidos`, e por isso a pessoa volta a contar como avulsa
 *   se o grupo for trocado por outro de que ela não faz parte.
 */

import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import type { Integrante } from "~/features/entidades/shared/integrantes";

export interface SelecaoInscricao {
    /** O grupo que se apresenta, se houver. É o cartão da lista, sem a formação. */
    grupo: GrupoComPrevia | null;
    /** Integrantes marcados um a um, fora do grupo. */
    incluidos: Integrante[];
    /** Ids de membros do grupo que ficam de fora desta inscrição. */
    excluidos: number[];
}

/** O corpo que `inscricao.create` vai receber quando existir. */
export interface PayloadInscricao {
    grupo: number | null;
    integrantes_incluidos: number[];
    integrantes_excluidos: number[];
}

/** Uma linha do ticket: a pessoa e por onde ela entrou na inscrição. */
export interface LinhaDoTicket {
    integrante: Integrante;
    origem: "grupo" | "individual";
}

export const selecaoVazia: SelecaoInscricao = {
    grupo: null,
    incluidos: [],
    excluidos: [],
};

/**
 * Marca o grupo — ou desmarca, se for o mesmo.
 *
 * Clicar no grupo já marcado o tira da inscrição; clicar em outro o troca.
 * Nos dois casos as exclusões zeram: pertenciam à formação do grupo que saiu.
 */
export function escolherGrupo(
    selecao: SelecaoInscricao,
    grupo: GrupoComPrevia,
): SelecaoInscricao {
    if (selecao.grupo?.id === grupo.id) {
        return { ...selecao, grupo: null, excluidos: [] };
    }

    return { ...selecao, grupo, excluidos: [] };
}

/**
 * O clique num integrante — na lista ou no ticket.
 *
 * Quem é membro do grupo escolhido entra e sai pela lista de exclusões: o
 * clique alterna a pessoa em `excluidos`, e a tira de `incluidos` caso tenha
 * sido marcada como avulsa antes de o grupo chegar — senão, ao tirar a pessoa
 * do grupo, ela voltaria pela porta dos avulsos. Quem não é membro alterna em
 * `incluidos`.
 *
 * `membrosDoGrupo` são os ids da formação carregada por `grupo.getById`;
 * enquanto ela não chega, o conjunto é vazio e todo mundo é avulso — e a
 * regra "o grupo vence", em {@link montarTicket} e {@link montarPayload},
 * corrige a conta quando a formação aparece.
 */
export function alternarIntegrante(
    selecao: SelecaoInscricao,
    integrante: Integrante,
    membrosDoGrupo: ReadonlySet<number>,
): SelecaoInscricao {
    if (membrosDoGrupo.has(integrante.id)) {
        const excluido = selecao.excluidos.includes(integrante.id);
        return {
            ...selecao,
            excluidos: excluido
                ? selecao.excluidos.filter((id) => id !== integrante.id)
                : [...selecao.excluidos, integrante.id],
            incluidos: selecao.incluidos.filter(
                ({ id }) => id !== integrante.id,
            ),
        };
    }

    const incluido = selecao.incluidos.some(({ id }) => id === integrante.id);
    return {
        ...selecao,
        incluidos: incluido
            ? selecao.incluidos.filter(({ id }) => id !== integrante.id)
            : [...selecao.incluidos, integrante],
    };
}

/**
 * As linhas do ticket, na ordem em que se leem: primeiro a formação do grupo
 * menos quem ficou de fora, depois os avulsos que não são do grupo.
 *
 * `integrantesDoGrupo` é a formação vinda de `grupo.getById` — vazia enquanto
 * carrega, e aí o ticket mostra só os avulsos (e esqueletos no lugar do
 * grupo; ver `ticket-inscricao.tsx`).
 */
export function montarTicket(
    selecao: SelecaoInscricao,
    integrantesDoGrupo: Integrante[],
): LinhaDoTicket[] {
    const membros = new Set(integrantesDoGrupo.map(({ id }) => id));
    const excluidos = new Set(selecao.excluidos);

    const doGrupo = integrantesDoGrupo
        .filter(({ id }) => !excluidos.has(id))
        .map((integrante): LinhaDoTicket => ({ integrante, origem: "grupo" }));

    const avulsos = selecao.incluidos
        .filter(({ id }) => !membros.has(id))
        .map((integrante): LinhaDoTicket => ({
            integrante,
            origem: "individual",
        }));

    return [...doGrupo, ...avulsos];
}

/**
 * O corpo do envio. `integrantes_incluidos` só leva quem não é do grupo — o
 * grupo vence, e o backend já relaciona a formação dele pelo id.
 */
export function montarPayload(
    selecao: SelecaoInscricao,
    membrosDoGrupo: ReadonlySet<number>,
): PayloadInscricao {
    return {
        grupo: selecao.grupo?.id ?? null,
        integrantes_incluidos: selecao.incluidos
            .filter(({ id }) => !membrosDoGrupo.has(id))
            .map(({ id }) => id),
        integrantes_excluidos: selecao.excluidos,
    };
}
