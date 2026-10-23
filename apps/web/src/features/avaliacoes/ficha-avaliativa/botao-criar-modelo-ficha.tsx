import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import type { CategoriaDeOrigem } from "./lib/categoria-de-origem";
import { caminhoCriarModeloParaCategoria } from "./lib/categoria-de-origem";

/**
 * Atalho para criar modelo de ficha, na primeira vaga da grade do seletor.
 *
 * Fica do tamanho da prancheta de um cartão, e com a borda
 * tracejada de uma vaga vazia, mas mantém o feedback de controle — cursor,
 * realce no hover e anel de foco — para não ser lido como mais um modelo da
 * lista.
 *
 * O modelo se monta numa página própria, então o atalho é um link e não abre
 * modal. No seletor de uma categoria, o link leva a categoria junto: o editor
 * vincula o modelo a ela ao criá-lo e volta para o detalhe dela, em vez de
 * largar a pessoa na lista.
 */
export function BotaoCriarModeloFicha({
    categoria,
}: {
    categoria?: CategoriaDeOrigem;
}) {
    return (
        <li className="pt-2.5">
            <Link
                href={
                    categoria
                        ? caminhoCriarModeloParaCategoria(categoria)
                        : "/admin/fichas-avaliativas/criar"
                }
                className="bg-card text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring/50 focus-visible:outline-ring flex aspect-3/4 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 text-center transition-colors focus-visible:ring-[3px] focus-visible:outline-1"
            >
                <PlusIcon aria-hidden="true" weight="bold" className="size-5" />
                <span className="text-sm">Criar modelo</span>
            </Link>
        </li>
    );
}
