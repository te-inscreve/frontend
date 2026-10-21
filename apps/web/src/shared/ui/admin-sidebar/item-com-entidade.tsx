import "server-only";

import { Suspense } from "react";

import { temEntidade } from "@te-inscreve/schemas";

import type { ItemNavegacaoComSubItens } from "./items-map";
import { getPerfil } from "~/features/usuarios/lib/get-perfil";
import { SidebarItem } from "./sidebar-item";
import { SubItens } from "./sub-itens";

/**
 * Um item de primeiro nível que só existe para quem tem vínculo com uma
 * entidade — diferente de `subItensExigemEntidade`, aqui é a linha inteira que
 * some, não só os filhos.
 *
 * Mesmo padrão do {@link SubItens}: síncrono por fora, `Suspense` por dentro,
 * para não segurar o resto da sidebar atrás do perfil.
 */
export function ItemComEntidade({ item }: { item: ItemNavegacaoComSubItens }) {
    return (
        <Suspense fallback={null}>
            <ItemComVinculo item={item} />
        </Suspense>
    );
}

async function ItemComVinculo({ item }: { item: ItemNavegacaoComSubItens }) {
    const perfil = await getPerfil().catch((erro: unknown) => {
        console.error("[perfil] não foi possível montar o item", erro);
        return null;
    });

    if (!perfil || !temEntidade(perfil)) return null;

    return (
        <SidebarItem item={item}>
            <SubItens item={item} />
        </SidebarItem>
    );
}
