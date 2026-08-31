import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

interface Props {
    eventoId: number;
}

/**
 * Atalho para o formulário de modalidade, desenhado como mais uma aba da
 * lista — é o próximo item da fila de modalidades, e não um botão avulso no
 * cabeçalho.
 *
 * É um link, não um `TabsTrigger`: ele navega para outra página em vez de
 * trocar o painel, então não entra na semântica de abas do Radix — daí o
 * `role="link"` implícito e a borda tracejada, que o distinguem das abas de
 * verdade sem tirá-lo da linha.
 */
export function TabCriarModalidade({ eventoId }: Props) {
    return (
        <Link
            href={`/admin/eventos/${eventoId}/modalidades/criar`}
            className="text-muted-foreground hover:text-primary focus-visible:ring-ring/50 focus-visible:outline-ring relative inline-flex h-[calc(100%-1px)] shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 [&_svg]:size-4 [&_svg]:shrink-0"
        >
            <PlusIcon aria-hidden="true" />
            Criar modalidade
        </Link>
    );
}
