import "server-only";

import type { IconName } from "./icons-map";

export interface ItemNavegacao {
    titulo?: string;
    href: string;
    icone?: IconName;
}

export interface ItemNavegacaoComSubItens extends ItemNavegacao {
    subItens?: ItemNavegacao[];
    /**
     * Se os `subItens` só aparecem para quem tem vínculo com uma entidade.
     *
     * O portão fica declarado aqui, e não implícito em "todo submenu", porque
     * hoje só um item tem filhos: gatear pela existência de `subItens` faria o
     * próximo item que ganhasse filhos herdar a regra sem ninguém pedir.
     */
    subItensExigemEntidade?: boolean;
    exigeEntidade?: boolean;
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
                subItensExigemEntidade: true,
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
                // O item em si fica para todo mundo: é por ele que quem não tem
                // vínculo chega ao pedido de acesso. Só os filhos é que somem —
                // todos levam a telas que o portão do segmento já barra.
                subItensExigemEntidade: true,
                subItens: [
                    {
                        titulo: "Integrantes",
                        href: "/admin/minha-entidade/integrantes",
                        icone: "user",
                    },
                    {
                        titulo: "Grupos",
                        href: "/admin/minha-entidade/grupos",
                        icone: "group",
                    },
                    {
                        titulo: "Inscrições",
                        href: "/admin/minha-entidade/inscricoes",
                        icone: "ticket",
                    },
                ],
            },
            {
                titulo: "Fichas Avaliativas",
                href: "/admin/fichas-avaliativas",
                icone: "ficha",
                exigeEntidade: true,
            },
        ],
    },
];

export const itensMap: ItensMap[] = getItensMap();
