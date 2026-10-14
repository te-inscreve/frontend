import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

/**
 * Atalho para criar modelo de ficha, na primeira vaga da grade do seletor.
 *
 * Fica do tamanho da folha de um cartão, em proporção A4, e com a borda
 * tracejada de uma vaga vazia, mas mantém o feedback de controle — cursor,
 * realce no hover e anel de foco — para não ser lido como mais um modelo da
 * lista.
 *
 * O modelo se monta numa página própria, então o atalho é um link e não abre
 * modal.
 */
export function BotaoCriarModeloFicha() {
    return (
        <li>
            <Link
                href="/admin/fichas-avaliativas/criar"
                className="bg-card text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring/50 focus-visible:outline-ring flex aspect-210/297 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center transition-colors focus-visible:ring-[3px] focus-visible:outline-1"
            >
                <PlusIcon aria-hidden="true" weight="bold" className="size-6" />
                <span className="text-sm">Criar modelo</span>
            </Link>
        </li>
    );
}
