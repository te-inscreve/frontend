import { notFound } from "next/navigation";

import { FormEvento } from "~/features/eventos/form-evento/form-evento";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { parseInteger } from "~/shared/utils/parsers";

export const metadata = {
    title: "Editar evento | Te Inscreve",
    description: "Edição de um evento da entidade",
};

export default async function EditarEventoPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const idEvento = parseInteger(slug);

    if (!idEvento) notFound();

    // O formulário precisa dos valores atuais para montar os `defaultValues`,
    // então aqui se espera o evento em vez de servir um shell com `Suspense`.
    const evento = await getQueryClient().fetchQuery(
        trpc.evento.getById.queryOptions({ id: idEvento }),
    );

    if (!evento) notFound();

    return <FormEvento evento={evento} />;
}
