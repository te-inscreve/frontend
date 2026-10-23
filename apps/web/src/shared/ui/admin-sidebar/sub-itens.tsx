import "server-only";

import { Suspense } from "react";

import { SidebarMenuSub } from "@te-inscreve/components/components/sidebar";
import { temEntidade } from "@te-inscreve/schemas";

import type { ItemNavegacaoComSubItens } from "./items-map";
import { getPerfil } from "~/features/usuarios/lib/get-perfil";
import { SidebarItem } from "./sidebar-item";

/**
 * O submenu de um item, com o portão que ele pedir.
 *
 * Fica síncrono de propósito: quem espera pelo perfil é o
 * {@link SubItensComVinculo}, dentro do `Suspense`. Assim a casca do painel —
 * sidebar, header e o miolo da página — pinta sem depender de rede, e os
 * subitens chegam depois por streaming.
 *
 * O `fallback` é vazio, e não um esqueleto: o grupo com submenu é o último da
 * sidebar, então os itens entram sem empurrar nada, e quem não tem vínculo não
 * vê linhas cinzas piscarem para sumir logo em seguida.
 */
export function SubItens({ item }: { item: ItemNavegacaoComSubItens }) {
    const { subItens } = item;

    if (!subItens?.length) return null;

    if (!item.subItensExigemEntidade)
        return <ListaDeSubItens itens={subItens} />;

    return (
        <Suspense fallback={null}>
            <SubItensComVinculo itens={subItens} />
        </Suspense>
    );
}

/**
 * Os subitens de quem tem vínculo com uma entidade; nada para os demais.
 *
 * A regra vem do perfil, e não de um 403 da entidade, pelo mesmo motivo do
 * portão de `/admin/minha-entidade` — ver {@link temEntidade}. Os dois leem
 * pelo `getPerfil`, que compartilha o query client da requisição, então a
 * sidebar não custa uma ida extra à API.
 *
 * Perfil que não carrega esconde o submenu em vez de derrubar a sidebar: menu é
 * navegação, e o item pai continua lá levando à mesma tela.
 */
async function SubItensComVinculo({
    itens,
}: {
    itens: ItemNavegacaoComSubItens[];
}) {
    const perfil = await getPerfil().catch((erro: unknown) => {
        console.error("[perfil] não foi possível montar o submenu", erro);
        return null;
    });

    if (!perfil || !temEntidade(perfil)) return null;

    return <ListaDeSubItens itens={itens} />;
}

function ListaDeSubItens({ itens }: { itens: ItemNavegacaoComSubItens[] }) {
    return (
        <SidebarMenuSub>
            {itens.map((subItem) => (
                <SidebarItem key={subItem.href} item={subItem} subItem />
            ))}
        </SidebarMenuSub>
    );
}
