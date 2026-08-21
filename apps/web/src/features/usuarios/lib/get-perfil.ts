import "server-only";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";

/**
 * Perfil do usuário da sessão, lido de um Server Component.
 *
 * Passa pelo tRPC como qualquer outra leitura — nada aqui fala REST direto. O
 * query client é memoizado por requisição, então o topbar e a página de perfil
 * dividem uma única ida à API.
 */
export async function getPerfil() {
    return getQueryClient().fetchQuery(trpc.perfil.me.queryOptions());
}
