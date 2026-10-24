import { useQuery } from "@tanstack/react-query";

import type { MinhaAvaliacao, MinhasAvaliacoes } from "@te-inscreve/schemas";
import { formatarDecimal } from "@te-inscreve/schemas";

import type { AvaliacaoLocal } from "~/db/schema";
import { nomeCompleto } from "~/features/categorias/lib/integrante";
import { trpc } from "~/utils/api";

/** As avaliações de uma categoria, com o contexto que o título da seção mostra. */
export interface SecaoMinhasAvaliacoes {
    categoriaId: number;
    /** "Modalidade Categoria", como o cartão de categoria. */
    titulo: string;
    eventoNome: string;
    data: MinhaAvaliacao[];
}

/**
 * Um card da lista: a avaliação que o servidor devolveu, ou a do aparelho que
 * ele ainda não devolveu — na fila, enviando, com erro, ou sincronizada há
 * pouco, antes de a lista recarregar.
 */
export type ItemMinhasAvaliacoes =
    | { tipo: "servidor"; avaliacao: MinhaAvaliacao }
    | { tipo: "local"; avaliacao: AvaliacaoLocal };

/** Uma seção da lista, com as avaliações do servidor e as do aparelho. */
export interface SecaoComPendentes extends Omit<SecaoMinhasAvaliacoes, "data"> {
    data: ItemMinhasAvaliacoes[];
}

/**
 * As seções do servidor com as avaliações que ainda não chegaram lá, cada
 * uma na seção da sua categoria e antes das enviadas: quem acabou de salvar
 * acha a avaliação onde espera, marcada como ainda no aparelho. A categoria
 * que só tem pendentes ganha uma seção no fim, montada da linha local.
 *
 * A local que o servidor já devolveu sai: o card do servidor vale. A
 * sincronizada que ele ainda não devolveu fica, para o card não sumir entre
 * o envio e a lista recarregar.
 */
export function secoesComPendentes(
    secoes: SecaoMinhasAvaliacoes[],
    locais: AvaliacaoLocal[],
): SecaoComPendentes[] {
    const noServidor = new Set(
        secoes.flatMap((secao) => secao.data.map((item) => item.inscricaoId)),
    );
    const pendentesPorCategoria = new Map<number, AvaliacaoLocal[]>();
    // As que ainda não foram primeiro; as sincronizadas há pouco, depois.
    const ordenadas = [
        ...locais.filter((local) => local.estado !== "sincronizada"),
        ...locais.filter((local) => local.estado === "sincronizada"),
    ];
    for (const local of ordenadas) {
        if (noServidor.has(local.inscricaoId)) continue;
        const lista = pendentesPorCategoria.get(local.categoriaId) ?? [];
        lista.push(local);
        pendentesPorCategoria.set(local.categoriaId, lista);
    }

    const comServidor = secoes.map((secao) => {
        const pendentes = pendentesPorCategoria.get(secao.categoriaId) ?? [];
        pendentesPorCategoria.delete(secao.categoriaId);
        return {
            ...secao,
            data: [
                ...pendentes.map(itemLocal),
                ...secao.data.map(
                    (avaliacao) => ({ tipo: "servidor", avaliacao }) as const,
                ),
            ],
        };
    });

    const soLocais = [...pendentesPorCategoria.entries()].flatMap(
        ([categoriaId, pendentes]) => {
            const [primeira] = pendentes;
            if (!primeira) return [];
            const { inscricao } = primeira;
            return [
                {
                    categoriaId,
                    titulo: `${inscricao.modalidade} ${inscricao.categoria}`,
                    eventoNome: inscricao.evento,
                    data: pendentes.map(itemLocal),
                },
            ];
        },
    );

    return [...comServidor, ...soLocais];
}

function itemLocal(avaliacao: AvaliacaoLocal) {
    return { tipo: "local", avaliacao } as const;
}

/**
 * O histórico do avaliador: as avaliações que o servidor já aceitou, de
 * `GET /minhas-avaliacoes/`. As que ainda estão no aparelho não entram.
 */
export function useMinhasAvaliacoes() {
    return useQuery({
        ...trpc.avaliacao.getMinhasAvaliacoes.queryOptions(),
        select: secoesDasAvaliacoes,
    });
}

/**
 * Uma seção por categoria, na ordem da árvore evento → modalidade →
 * categoria que o backend devolve.
 */
export function secoesDasAvaliacoes(
    eventos: MinhasAvaliacoes,
): SecaoMinhasAvaliacoes[] {
    return eventos.flatMap((evento) =>
        evento.modalidades.flatMap((modalidade) =>
            modalidade.categorias.map((categoria) => ({
                categoriaId: categoria.id,
                titulo: `${modalidade.nome} ${categoria.nome}`,
                eventoNome: evento.nome,
                data: categoria.avaliacoes,
            })),
        ),
    );
}

/**
 * Quem se apresentou, como o bilhete da inscrição o mostra: o concorrente na
 * individual; na em grupo, o nome de concorrente ou, sem ele, a entidade.
 */
export function nomeDoAvaliado(avaliacao: MinhaAvaliacao) {
    if (avaliacao.concorrente) return nomeCompleto(avaliacao.concorrente);
    if (avaliacao.nomeConcorrente) return avaliacao.nomeConcorrente;
    // `concorrente: null` é a individual sem integrante; sem a chave, é grupo.
    return avaliacao.concorrente === null
        ? "Concorrente não informado"
        : avaliacao.entidade.nome;
}

/** `"8.7500"` → `"8,75"`. */
export function formatarNota(nota: string) {
    return formatarDecimal(Number(Number(nota).toFixed(2)));
}
