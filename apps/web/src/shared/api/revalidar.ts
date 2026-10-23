"use server";

import { updateTag } from "next/cache";

import {
    tagCategoria,
    tagCategoriasDaModalidade,
    tagEvento,
    tagFichaDaCategoria,
    tagInscricoesDaCategoria,
    tagModalidade,
    tagModalidadesDoEvento,
    tagsEntidades,
    tagsEventos,
    tagsPerfil,
} from "@te-inscreve/api";

/**
 * Derruba o cache das buscas do servidor depois de uma mutação.
 *
 * As telas do admin são Server Components, e os `fetch` delas guardam a
 * resposta por 30 segundos (`next: { revalidate }`). Sem isto, o
 * `router.refresh()` que vem depois de uma mutação receberia a mesma resposta
 * de antes — o objeto recém-criado só entraria na tela quando o cache
 * expirasse, e o organizador veria o sucesso sem ver o resultado.
 *
 * `updateTag`, e não `revalidateTag`: chamado de dentro de uma Server Action,
 * ele garante que a próxima leitura já enxergue a própria escrita. Por isso
 * cada função daqui precisa ser aguardada **antes** do `router.refresh()`.
 *
 * As tags vêm de `@te-inscreve/api`, as mesmas que os routers gravam. Enquanto
 * eram reescritas à mão deste lado, os dois se afastavam em silêncio: era o
 * que deixava a categoria nova invisível na fila da modalidade.
 */

// As Server Actions são sempre `async` por contrato do Next, mesmo sem `await`.
/* eslint-disable @typescript-eslint/require-await */

/** Depois de criar ou excluir um evento: quem envelheceu é a listagem. */
export async function revalidarListaEventos() {
    tagsEventos().forEach((tag) => updateTag(tag));
}

/**
 * Depois de editar o evento, ou de mexer nas modalidades dele.
 *
 * A tag das modalidades também alcança o detalhe de cada uma — um `fetch` cai
 * por qualquer uma das suas tags —, então isto cobre a régua de abas inteira.
 */
export async function revalidarEvento(eventoId: number) {
    updateTag(tagEvento(eventoId));
    updateTag(tagModalidadesDoEvento(eventoId));
}

/**
 * Depois de mexer numa modalidade ou nas categorias dela.
 *
 * As categorias entram junto porque o painel da aba sai de
 * `modalidade.getById`, que já as traz aninhadas.
 */
export async function revalidarModalidade(
    eventoId: number,
    modalidadeId: number,
) {
    updateTag(tagModalidadesDoEvento(eventoId));
    updateTag(tagModalidade(modalidadeId));
    updateTag(tagCategoriasDaModalidade(modalidadeId));
}

/** Depois de editar uma categoria — o detalhe dela também envelheceu. */
export async function revalidarCategoria(
    eventoId: number,
    modalidadeId: number,
    categoriaId: number,
) {
    await revalidarModalidade(eventoId, modalidadeId);
    updateTag(tagCategoria(categoriaId));
}

/**
 * Depois de criar inscrições: a aba de inscritos da categoria envelheceu, e o
 * detalhe dela também — o `canInscrever` que decide o botão de inscrição.
 */
export async function revalidarInscricoes(categoriaId: number) {
    updateTag(tagInscricoesDaCategoria(categoriaId));
    updateTag(tagCategoria(categoriaId));
}

/** Depois de vincular um modelo de ficha à categoria: a aba da ficha. */
export async function revalidarFichaDaCategoria(categoriaId: number) {
    updateTag(tagFichaDaCategoria(categoriaId));
}

/**
 * Depois de editar o cadastro da própria entidade.
 *
 * `entidade.minha` não é cacheada, então quem envelhece não é a tela que
 * acabou de salvar — é a listagem de `entidade.getAll`, onde o nome aparece
 * para todo mundo escolher no pedido de acesso.
 */
export async function revalidarEntidades() {
    tagsEntidades().forEach((tag) => updateTag(tag));
}

/**
 * Depois que algo pode ter mudado o vínculo da conta com uma entidade.
 *
 * `perfil.me` é a única leitura daqui que ninguém escreve: não existe mutation
 * de perfil, e quem vincula a conta a uma entidade faz isso fora do app. O
 * prazo de 60 segundos do router era a única saída, e enquanto ele não vence a
 * pessoa vê a tela de pedido de acesso mesmo já tendo sido vinculada. Esta
 * função é a saída manual — o botão de atualizar do pedido de acesso.
 */
export async function revalidarPerfil() {
    tagsPerfil().forEach((tag) => updateTag(tag));
}
