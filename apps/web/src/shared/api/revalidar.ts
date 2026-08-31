"use server";

import { updateTag } from "next/cache";

/**
 * Derruba o cache das buscas do evento no servidor.
 *
 * As telas do evento são Server Components, e os `fetch` delas guardam a
 * resposta por 30 segundos (`next: { revalidate }`). Sem isto, o
 * `router.refresh()` que vem depois de uma mutação receberia a mesma resposta
 * de antes — a modalidade recém-criada só entraria na régua de abas quando o
 * cache expirasse, e o organizador veria o sucesso sem ver a aba.
 *
 * `updateTag`, e não `revalidateTag`: chamado de dentro de uma Server Action,
 * ele garante que a próxima leitura já enxergue a própria escrita.
 */
// Server Action é sempre `async` por contrato do Next, mesmo sem `await`.
// eslint-disable-next-line @typescript-eslint/require-await
export async function revalidarEvento(eventoId: number) {
    updateTag(`evento-${eventoId}`);
    updateTag(`evento-${eventoId}-modalidades`);
}
