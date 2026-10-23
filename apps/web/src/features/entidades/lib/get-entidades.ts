import "server-only";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";

export async function getEntidades() {
    return getQueryClient().fetchQuery(trpc.entidade.getAll.queryOptions());
}
