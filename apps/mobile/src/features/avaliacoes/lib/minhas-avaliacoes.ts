import { useQuery } from "@tanstack/react-query";

import type { MinhaAvaliacao, MinhasAvaliacoes } from "@te-inscreve/schemas";
import { formatarDecimal } from "@te-inscreve/schemas";

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
