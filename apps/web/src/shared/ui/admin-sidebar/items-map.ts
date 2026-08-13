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
                        titulo: "Artistas",
                        href: "/admin/minha-entidade/artistas",
                        icone: "mask",
                    },
                    {
                        titulo: "Grupos de Artistas",
                        href: "/admin/minha-entidade/grupos",
                        icone: "group",
                    },
                    {
                        titulo: "Inscrições",
                        href: "/admin/minha-entidade/inscricoes",
                        icone: "ticket",
                    },
                    {
                        titulo: "Sala de Troféus",
                        href: "/admin/minha-entidade/trofeus",
                        icone: "trophy",
                    },
                ],
            },
        ],
    },
];

export const itensMap: ItensMap[] = getItensMap();
