import { Skeleton } from "@te-inscreve/components/components/skeleton";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import type { TrilhaPasso } from "~/shared/ui/trilha-builder";
import { TrilhaBuilder } from "~/shared/ui/trilha-builder";

interface Props {
    eventoId: number;
    /**
     * Modalidade em que a página está. Vem da query `?modalidade=`, já que ela
     * não faz parte da rota — o nome sai das modalidades do próprio evento.
     */
    modalidadeId?: number;
    /**
     * Rótulo da página atual, o último degrau da trilha. Sem link, porque já se
     * está nele. Ausente quando a própria modalidade é o destino.
     */
    atual?: string;
}

/**
 * Trilha "evento › modalidade › página atual" das telas aninhadas no evento.
 *
 * Server Component: o `fetchQuery` divide o cache por request com o `prefetch`
 * da página, então o evento não é buscado duas vezes. Se ele não vier (id de
 * link velho), a trilha some em vez de derrubar a página — quem decide o 404 é
 * o conteúdo, e não a navegação.
 */
export async function TrilhaEvento({ eventoId, modalidadeId, atual }: Props) {
    const evento = await getQueryClient().fetchQuery(
        trpc.evento.getById.queryOptions({ id: eventoId }),
    );

    if (!evento) return null;

    const modalidade = evento.modalidades.find(({ id }) => id === modalidadeId);

    // A modalidade é o último degrau quando não há página abaixo dela.
    const modalidadeEhAtual = modalidade !== undefined && atual === undefined;

    const passos: TrilhaPasso[] = [
        { label: evento.nome, href: `/admin/eventos/${eventoId}` },
    ];

    if (modalidade !== undefined) {
        passos.push({
            label: modalidade.nome,
            href: modalidadeEhAtual
                ? undefined
                : `/admin/eventos/${eventoId}?modalidade=${modalidade.id}`,
        });
    }

    if (atual !== undefined) {
        passos.push({ label: atual });
    }

    return <TrilhaBuilder passos={passos} />;
}

/** Espaço reservado da trilha enquanto o evento não chega. */
export function TrilhaEventoSkeleton() {
    return <Skeleton className="h-5 w-64" />;
}
