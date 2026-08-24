import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DetalheEvento } from "~/features/eventos/evento-detail/detalhe-evento";
import { DetalheEventoSkeleton } from "~/features/eventos/evento-detail/detalhe-evento-skeleton";
import { prefetch, trpc } from "~/shared/api/trpc/server";
import { GoBackButton } from "~/shared/ui/back-btn";

/** Aba de modalidade selecionada, quando ela veio na URL. */
function parseModalidade(valor: string | string[] | undefined) {
    // Só a primeira ocorrência importa: `?modalidade=1&modalidade=2` é uma URL
    // montada à mão, não algo que as abas produzam.
    const bruto = Array.isArray(valor) ? valor[0] : valor;
    if (bruto === undefined) return undefined;

    const id = Number(bruto);
    // Lixo no parâmetro não é erro de página: `DetalheEvento` cai na primeira
    // modalidade, como se a aba nunca tivesse sido escolhida.
    return Number.isInteger(id) && id > 0 ? id : undefined;
}

export default async function EventoDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ slug }, query] = await Promise.all([params, searchParams]);
    const id = Number(slug);

    // A lista linka por `id`, então uma URL com qualquer outra coisa não
    // corresponde a evento nenhum — e `getById` só aceita inteiro positivo.
    if (!Number.isInteger(id) || id <= 0) notFound();

    const modalidadeAtiva = parseModalidade(query.modalidade);

    // Dispara as buscas antes da fronteira de Suspense: o shell abaixo já sai no
    // stream enquanto os requests correm, e `DetalheEvento` só aguarda as promises.
    void prefetch(trpc.evento.getById.queryOptions({ id }));
    void prefetch(trpc.modalidade.getAll.queryOptions({ eventoId: id }));

    // As categorias só entram aqui quando a aba veio na URL. Sem o parâmetro, a
    // ativa é a primeira modalidade — e qual é ela só se sabe depois da lista.
    if (modalidadeAtiva !== undefined) {
        void prefetch(
            trpc.categoria.getAll.queryOptions({
                eventoId: id,
                modalidadeId: modalidadeAtiva,
            }),
        );
    }

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <GoBackButton href="/admin/eventos" />

            <Suspense fallback={<DetalheEventoSkeleton />}>
                <DetalheEvento id={id} modalidadeAtiva={modalidadeAtiva} />
            </Suspense>
        </div>
    );
}
