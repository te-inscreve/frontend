import "server-only";

import type { IconName } from "./icons-map";

export interface ItemNavegacao {
    titulo?: string;
    href: string;
    icone: IconName;
}

export interface ItemNavegacaoComSubItens extends ItemNavegacao {
    subItens?: ItemNavegacao[];
}

interface ItensMap {
    titulo?: string;
    itens: ItemNavegacaoComSubItens[];
}

const getItensMap = (): ItensMap[] => [
    {
        itens: [
            {
                titulo: "Eventos",
                href: "/admin/eventos",
                icone: "calendar",
            },
        ],
    },
    {
        titulo: "Gerenciamento",
        itens: [
            {
                titulo: "Minha Entidade",
                href: "/admin/minha-entidade",
                icone: "buildings",
                subItens: [
                    {
                        titulo: "Editar",
                        href: "/admin/minha-entidade/editar",
                        icone: "buildings",
                    },
                ],
            },
        ],
    },
];

export const itensMap: ItensMap[] = getItensMap();
