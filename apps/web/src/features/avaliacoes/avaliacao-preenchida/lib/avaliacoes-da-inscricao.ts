import type { AvaliacaoDaInscricao, Avaliador } from "@te-inscreve/schemas";

export interface CaminhoDaInscricao {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    inscricaoId: number;
}

/**
 * As avaliações na ordem em que chegaram: é por essa ordem que cada uma ganha
 * o seu número — "Avaliação 2" —, que a identifica quando o avaliador não
 * tem nome no cadastro.
 */
export function ordenarAvaliacoes<T extends AvaliacaoDaInscricao>(
    avaliacoes: T[],
) {
    return [...avaliacoes].sort(
        (a, b) =>
            Date.parse(a.dataEnvio) - Date.parse(b.dataEnvio) || a.id - b.id,
    );
}

/**
 * Só os ids da categoria: a chave de query é o input inteiro, e um
 * `inscricaoId` a mais nas leituras da categoria perderia o `prefetch`.
 */
export const daCategoria = ({
    eventoId,
    modalidadeId,
    categoriaId,
}: CaminhoDaInscricao) => ({ eventoId, modalidadeId, categoriaId });

/** A tela com as fichas da inscrição, onde se escolhe qual inspecionar. */
export const hrefFichasDaInscricao = (caminho: CaminhoDaInscricao) =>
    `/admin/eventos/${caminho.eventoId}/modalidades/${caminho.modalidadeId}/categorias/${caminho.categoriaId}/inscricoes/${caminho.inscricaoId}/avaliacoes`;

/**
 * O fuso fixo é de propósito: a data chega em UTC e é escrita tanto no
 * servidor quanto no navegador. Com o fuso de quem roda, a página do servidor
 * sairia em UTC e o cliente divergiria na hidratação. Os eventos são no
 * Brasil, no horário de Brasília.
 */
const formatoDataEnvio = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
});

/** `"2026-10-24T17:32:10Z"` → `"24/10/2026, 14:32"`. */
export const formatarDataEnvio = (iso: string) =>
    formatoDataEnvio.format(new Date(iso));

/** A nota como o backend a manda, truncada, só com a vírgula: `"8,7500"`. */
export const formatarNota = (nota: string) => nota.replace(".", ",");

/**
 * `"Maria Souza"`; sem nome no cadastro, o `username` (`"bgmartins"`). Nulo
 * só se nem ele vier, e aí quem identifica a ficha é o número dela.
 */
export const nomeDoAvaliador = ({ nome, sobrenome, username }: Avaliador) =>
    `${nome} ${sobrenome}`.trim() || username.trim() || null;
