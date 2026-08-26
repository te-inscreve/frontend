import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { cn } from "@te-inscreve/components";

interface Props {
    eventoId: number;
    modalidadeId: number;
    /**
     * Sem nenhuma categoria o atalho ocupa a largura de um cartão e explica o
     * vazio; ao lado de cartões ele encolhe e vira só o "mais" da fila.
     */
    sozinho: boolean;
}

/**
 * Atalho para criar categoria, no fim da fila de cartões.
 *
 * Fica do tamanho de um cartão e com a borda tracejada de uma vaga vazia, mas
 * mantém o feedback de controle — cursor, realce no hover e anel de foco — para
 * não ser lido como mais um cartão da lista.
 */
export function BotaoCriarCategoria({
    eventoId,
    modalidadeId,
    sozinho,
}: Props) {
    return (
        <Link
            href={`/admin/eventos/${eventoId}/modalidade/${modalidadeId}/criar-categoria`}
            className={cn(
                "text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 focus-visible:ring-ring/50 focus-visible:outline-ring flex h-full min-h-32 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center transition-colors focus-visible:ring-[3px] focus-visible:outline-1",
                sozinho ? "w-100" : "w-44",
            )}
        >
            <span className="bg-muted flex size-9 items-center justify-center rounded-full border border-dashed">
                <PlusIcon aria-hidden="true" />
            </span>
            <span className="text-sm font-medium">Criar categoria</span>
            {sozinho && (
                <span className="text-xs">
                    Esta modalidade ainda não tem categorias. Crie a primeira
                    para abrir inscrições.
                </span>
            )}
        </Link>
    );
}
