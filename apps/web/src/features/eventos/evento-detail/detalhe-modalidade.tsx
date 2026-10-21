import { notFound } from "next/navigation";

import type { PeriodoEvento } from "~/features/categorias/form-categoria/campos-categoria";
import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { ListCategorias } from "./list-categorias";
import { ResumoModalidade } from "./resumo-modalidade";

interface Props {
    eventoId: number;
    modalidadeId: number;
    /** Nome já conhecido pela aba — evita um título vazio antes da resposta. */
    modalidadeNome: string;
    /** Repassado ao cadastro de categoria, que limita a apresentação a ele. */
    periodoEvento: PeriodoEvento;
}

/**
 * Painel da aba aberta: as regras da modalidade e a fila de categorias dela.
 *
 * A busca acontece aqui dentro, atrás do `<Suspense>` do `DetalheEvento`, para
 * o cabeçalho e as abas irem para o stream sem esperar. As categorias vêm na
 * mesma resposta, então trocar de aba é uma requisição só.
 */
export async function DetalheModalidade({
    eventoId,
    modalidadeId,
    modalidadeNome,
    periodoEvento,
}: Props) {
    const modalidade = await getQueryClient().fetchQuery(
        trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }),
    );

    // A aba veio da lista do evento, então um 404 aqui é a modalidade tendo
    // sumido entre uma requisição e outra — não há painel para mostrar.
    if (!modalidade) notFound();

    return (
        <div className="flex flex-col gap-4">
            <ResumoModalidade
                eventoId={eventoId}
                modalidade={modalidade}
                modalidadeNome={modalidadeNome}
            />

            <ListCategorias
                eventoId={eventoId}
                modalidadeId={modalidadeId}
                modalidadeNome={modalidadeNome}
                categorias={modalidade.categorias}
                periodoEvento={periodoEvento}
            />
        </div>
    );
}
